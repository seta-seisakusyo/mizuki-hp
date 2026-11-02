import { isIP } from "node:net";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Build the Content-Security-Policy for one response. This is the single
 * source of the policy; nginx and next.config.ts no longer set it.
 */
export function buildContentSecurityPolicy(nonce: string, isProduction: boolean): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce'd Next.js runtime load reCAPTCHA; the
    // host list is only a fallback for browsers without CSP level 3.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? "" : " 'unsafe-eval'"} https://www.google.com https://www.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://static.wixstatic.com",
    "frame-src https://www.google.com",
    "connect-src 'self' https://www.google.com https://www.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
}

/** The site origin that state-changing API requests must come from. */
export function expectedOrigin(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

const originOf = (value: string | null) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * Reject cross-site writes to the API. Origin is preferred and Referer is the
 * fallback for clients that omit it; a write with neither is rejected.
 */
export function isAllowedApiWrite(input: {
  method: string;
  pathname: string;
  origin: string | null;
  referer: string | null;
  expected: string | null;
}): boolean {
  if (SAFE_METHODS.includes(input.method) || !isUnder(input.pathname, "/api")) return true;
  if (!input.expected) return false;
  const source = originOf(input.origin) ?? originOf(input.referer);
  return source === input.expected;
}

export function parseAllowedIps(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => isIP(ip) !== 0);
}

/**
 * Paths limited to ADMIN_ALLOWED_IPS. Public reads of news and blog, the
 * session lookup used by public pages, and the token-protected backup stay
 * reachable from anywhere.
 */
export function isAdminSurface(method: string, pathname: string): boolean {
  if (isUnder(pathname, "/portal-admin") || isUnder(pathname, "/portal-login")) return true;
  if (isUnder(pathname, "/api/admin")) return true;
  if (pathname === "/api/blog/backup") return false;
  if (isUnder(pathname, "/api/auth")) return !SAFE_METHODS.includes(method);
  if (pathname === "/api/email") return method !== "POST";
  if (isUnder(pathname, "/api/news") || isUnder(pathname, "/api/blog")) {
    return !SAFE_METHODS.includes(method);
  }
  return false;
}

/** An empty allow list disables the restriction. */
export function isAllowedAdminIp(allowedIps: string[], clientIp: string): boolean {
  return allowedIps.length === 0 || allowedIps.includes(clientIp);
}
