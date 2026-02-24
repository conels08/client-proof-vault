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

export function buildShareSummary({
  title,
  headline,
  bio,
  workExampleMetrics = [],
  testimonial,
  shareUrl
}: BuildShareSummaryInput) {
  const lines: string[] = [];

  const displayName = looksLikeEmail(title.trim()) ? '' : title.trim();
  const cleanHeadline = headline?.trim() ?? '';

  if (displayName && cleanHeadline) {
    lines.push(`${displayName} — ${cleanHeadline}`);
  } else if (displayName) {
    lines.push(displayName);
  } else if (cleanHeadline) {
    lines.push(cleanHeadline);
  }

  const cleanBio = bio?.trim() ?? '';
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
    const quote = shorten(testimonial.quote, 160);
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
