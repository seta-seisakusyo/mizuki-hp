import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "../auth.config";
import {
  buildContentSecurityPolicy,
  createNonce,
  expectedOrigin,
  isAdminSurface,
  isAllowedAdminIp,
  isAllowedApiWrite,
  parseAllowedIps,
} from "@/lib/edgeGuard";
import { getTrustedClientIp } from "@/lib/rateLimit";

const ADMIN_ROLES = ["ADMIN", "EDITOR"] as const;
const isProduction = process.env.NODE_ENV === "production";
const allowedAdminIps = parseAllowedIps(process.env.ADMIN_ALLOWED_IPS);
const siteOrigin = expectedOrigin(process.env.NEXTAUTH_URL ?? process.env.AUTH_URL);

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, method, headers } = req;
  const { pathname } = nextUrl;

  // Hide the admin surface from addresses outside the allow list.
  if (
    isAdminSurface(method, pathname) &&
    !isAllowedAdminIp(allowedAdminIps, getTrustedClientIp(headers))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (
    !isAllowedApiWrite({
      method,
      pathname,
      origin: headers.get("origin"),
      referer: headers.get("referer"),
      expected: siteOrigin,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isLoggedIn = Boolean(req.auth);
  const userRole = req.auth?.user?.role;
  const isProtectedRoute = pathname.startsWith("/portal-admin");
  const isLoginPage = pathname.startsWith("/portal-login");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/portal-login", nextUrl));
  }

  if (
    isProtectedRoute &&
    isLoggedIn &&
    !ADMIN_ROLES.includes(userRole as (typeof ADMIN_ROLES)[number])
  ) {
    return NextResponse.redirect(new URL("/?error=unauthorized", nextUrl));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/portal-admin", nextUrl));
  }

  // Next.js reads the nonce from the request's CSP header and applies it to
  // its own scripts; x-nonce and x-pathname are for server components.
  const nonce = createNonce();
  const policy = buildContentSecurityPolicy(nonce, isProduction);
  const requestHeaders = new Headers(headers);
  requestHeaders.set("content-security-policy", policy);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
});

export const config = {
  // Static assets and uploaded images skip the middleware; they carry no
  // scripts and are served with nosniff.
  matcher: [
    "/((?!_next/static|_next/image|uploads/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
  runtime: "nodejs",
};
