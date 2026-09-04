const verificationRoute = '/(auth)/verify-email';

export function getVerificationRoute(incomingUrl: string): string | null {
  try {
    const decodedUrl = decodeURIComponent(incomingUrl);
    const directMatch = decodedUrl.match(/ibivibe:\/\/\/auth\/verify-email\?([^\s#]+)/i);
    const routeMatch = decodedUrl.match(/\/auth\/verify-email\?([^\s#]+)/i);
    const query = directMatch?.[1] ?? routeMatch?.[1];

    if (!query) return null;

    const token = new URLSearchParams(query).get('token')?.trim();
    if (!token) return null;

    return `${verificationRoute}?token=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}
