/**
 * Public site origin for redirects.
 * Behind Liara (and similar hosts) Next listens on 0.0.0.0:3000, so
 * `request.url` is not the browser-facing host — prefer forwarded headers.
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host && !host.includes("localhost") && !host.startsWith("127.") ? "https" : "http");

  if (host && !host.startsWith("0.0.0.0")) {
    return `${proto}://${host}`;
  }

  const origin = request.headers.get("origin");
  if (origin) return origin;

  return new URL(request.url).origin;
}

export function absoluteUrl(request: Request, path: string): URL {
  return new URL(path, getRequestOrigin(request));
}
