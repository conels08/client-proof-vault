/**
 * Thumbnail backfill script for legacy rows.
 *
 * Run:
 *   node scripts/backfill-thumbs.mjs
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * This script is idempotent:
 * - Only processes rows where *_thumb_url is NULL.
 * - Uses upsert for thumbnail objects.
 * - Safe to re-run.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const BUCKET = 'proof-media';
const BATCH_SIZE = 100;

const AVATAR_SIZE = { width: 256, height: 256 };
const WORK_SIZE = { width: 640, height: 360 };

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function resolvePath(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const marker = `/${BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(url.pathname.slice(idx + marker.length));
      }
      return null;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith(`${BUCKET}/`)) {
    return trimmed.slice(BUCKET.length + 1);
  }

  return trimmed;
}

function buildThumbPath(originalPath) {
  const slashIndex = originalPath.lastIndexOf('/');
  const dir = slashIndex >= 0 ? originalPath.slice(0, slashIndex) : '';
  const fileName = slashIndex >= 0 ? originalPath.slice(slashIndex + 1) : originalPath;
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${dir}/thumbs/${base}-thumb.jpg`;
}

async function createJpegThumb(buffer, size) {
  return sharp(buffer)
    .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function processTable({
  supabase,
  table,
  originalCol,
  thumbCol,
  size
}) {
  const stats = {
    table,
    scanned: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  };

  let lastId = null;

  while (true) {
    let query = supabase
      .from(table)
      .select(`id, ${originalCol}, ${thumbCol}`)
      .is(thumbCol, null)
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`[${table}] query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      lastId = row.id;
      stats.scanned += 1;

      try {
        const rawOriginal = row[originalCol];
        const originalPath = resolvePath(rawOriginal);
        if (!originalPath) {
          stats.skipped += 1;
          continue;
        }

        const thumbPath = buildThumbPath(originalPath);

        const { data: fileData, error: downloadError } = await supabase.storage.from(BUCKET).download(originalPath);
        if (downloadError || !fileData) {
          throw new Error(`download failed for ${originalPath}: ${downloadError?.message ?? 'unknown error'}`);
        }

        const sourceBuffer = Buffer.from(await fileData.arrayBuffer());
        const thumbBuffer = await createJpegThumb(sourceBuffer, size);

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, {
          upsert: true,
          contentType: 'image/jpeg',
          cacheControl: '31536000'
        });
        if (uploadError) {
          throw new Error(`upload failed for ${thumbPath}: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase.from(table).update({ [thumbCol]: thumbPath }).eq('id', row.id);
        if (updateError) {
          throw new Error(`db update failed for ${row.id}: ${updateError.message}`);
        }

        stats.updated += 1;
      } catch (err) {
        stats.failed += 1;
        console.error(`[${table}] row ${row.id} failed:`, err instanceof Error ? err.message : String(err));
      }
    }
  }

  return stats;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing required env var: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  }
  requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  console.log('Starting thumbnail backfill...');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  const testimonialStats = await processTable({
    supabase,
    table: 'testimonials',
    originalCol: 'avatar_url',
    thumbCol: 'avatar_thumb_url',
    size: AVATAR_SIZE
  });

  const workStats = await processTable({
    supabase,
    table: 'work_examples',
    originalCol: 'image_url',
    thumbCol: 'image_thumb_url',
    size: WORK_SIZE
  });

  const total = {
    scanned: testimonialStats.scanned + workStats.scanned,
    updated: testimonialStats.updated + workStats.updated,
    skipped: testimonialStats.skipped + workStats.skipped,
    failed: testimonialStats.failed + workStats.failed
  };

  console.log('\nBackfill complete.');
  console.log(
    `[testimonials] scanned=${testimonialStats.scanned} updated=${testimonialStats.updated} skipped=${testimonialStats.skipped} failed=${testimonialStats.failed}`
  );
  console.log(
    `[work_examples] scanned=${workStats.scanned} updated=${workStats.updated} skipped=${workStats.skipped} failed=${workStats.failed}`
  );
  console.log(`[total] scanned=${total.scanned} updated=${total.updated} skipped=${total.skipped} failed=${total.failed}`);

  if (total.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
