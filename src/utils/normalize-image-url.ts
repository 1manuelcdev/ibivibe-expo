const legacyCdnPathPattern = /^\/(cities|businesses|events|users)\//;
const legacyCdnBaseUrl = 'https://cdn.ibivibe.com.br';

export function normalizeImageUrl(value?: string | null) {
  const url = value?.trim();

  if (!url) return null;
  const normalizedProtocolUrl = url.startsWith('//')
    ? `https:${url}`
    : legacyCdnPathPattern.test(url)
      ? `${legacyCdnBaseUrl}${url}`
      : url;

  if (
    !normalizedProtocolUrl.startsWith('http://') &&
    !normalizedProtocolUrl.startsWith('https://')
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedProtocolUrl);

    if (
      parsedUrl.hostname === 'cdn.ibivibe.com.br' &&
      legacyCdnPathPattern.test(parsedUrl.pathname)
    ) {
      parsedUrl.pathname = `/media${parsedUrl.pathname}`;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}
