type BuildShareSummaryInput = {
  title: string;
  headline?: string | null;
  bio?: string | null;
  workExampleMetrics?: string[];
  testimonial?: {
    quote: string;
    name: string;
    roleCompany?: string | null;
  } | null;
  shareUrl: string;
};

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function shorten(value: string, max: number) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function normalizeQuoteText(value: string) {
  const collapsedWhitespace = value.replace(/\s+/g, ' ').trim();
  const noRepeatedQuotes = collapsedWhitespace.replace(/["'“”‘’]{2,}/g, '"');
  const strippedEdges = noRepeatedQuotes
    .replace(/^["'“”‘’\s]+/, '')
    .replace(/["'“”‘’\s]+$/, '')
    .trim();

  return strippedEdges;
}

export function buildShareSummary({
  title,
  headline,
  bio,
  workExampleMetrics = [],
  testimonial,
  shareUrl
}: BuildShareSummaryInput) {
  const lines: string[] = [];

  const cleanTitle = title.trim();
  const displayName = looksLikeEmail(cleanTitle) ? '' : cleanTitle;
  const cleanHeadline = (headline ?? '').trim();

  if (displayName && cleanHeadline) {
    lines.push(`${displayName} — ${cleanHeadline}`);
  } else if (displayName) {
    lines.push(displayName);
  } else if (cleanHeadline) {
    lines.push(cleanHeadline);
  }

  const cleanBio = (bio ?? '').trim();
  if (cleanBio && cleanBio.length <= 140) {
    if (lines.length > 0) lines.push('');
    lines.push(cleanBio);
  }

  const metricLines = workExampleMetrics
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (metricLines.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Proof:');
    metricLines.forEach((metric) => lines.push(`• ${metric}`));
  }

  if (testimonial && testimonial.quote.trim() && testimonial.name.trim()) {
    const normalizedQuote = normalizeQuoteText(testimonial.quote);
    const quote = shorten(normalizedQuote, 160);
    const byline = testimonial.roleCompany?.trim()
      ? `${testimonial.name.trim()}, ${testimonial.roleCompany.trim()}`
      : testimonial.name.trim();

    if (lines.length > 0) lines.push('');
    lines.push('Featured testimonial:');
    lines.push(`"${quote}"`);
    lines.push(`— ${byline}`);
  }

  if (lines.length > 0) lines.push('');
  lines.push('View full proof:');
  lines.push(shareUrl);

  return lines.join('\n');
}

// Dev-only lightweight assertions for formatter regressions.
function runShareSummaryAssertions() {
  const sample = buildShareSummary({
    title: 'person@example.com',
    headline: 'Freelance Product Designer',
    bio: '  Delivers outcome-focused UX for B2B SaaS teams.  ',
    workExampleMetrics: [' +42% demo-to-paid conversion ', '18-day average implementation'],
    testimonial: {
      quote: '  ""Great partner to work with""  ',
      name: 'Jamie Lee',
      roleCompany: 'VP Product, Acme'
    },
    shareUrl: 'https://example.com/p/demo/share'
  });

  console.assert(!sample.includes('person@example.com'), 'shareSummary: email title should be omitted');
  console.assert(sample.includes('"Great partner to work with"'), 'shareSummary: quote normalization failed');
  console.assert(!sample.includes('""Great partner to work with""'), 'shareSummary: double quotes not stripped');
  console.assert(sample.includes('View full proof:\nhttps://example.com/p/demo/share'), 'shareSummary: share URL missing');
}

if (process.env.NODE_ENV === 'development' && process.env.SHARE_SUMMARY_SELF_TEST === '1') {
  runShareSummaryAssertions();
}
