import {
  buildContentSecurityPolicy,
  createNonce,
  expectedOrigin,
  isAdminSurface,
  isAllowedAdminIp,
  isAllowedApiWrite,
  parseAllowedIps,
} from "@/lib/edgeGuard";
import { decryptMfaSecret, deriveMfaKey, encryptMfaSecret, isMfaRequired, totpEnrollment } from "@/lib/mfa";
import { buildSecurityMail } from "@/lib/securityNotify";
import { afterEach, describe, expect, it } from "vitest";

describe("content security policy", () => {
  it("allows scripts only through the per-request nonce in production", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-inline' https://www.google.com");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("permits eval only in development", () => {
    expect(buildContentSecurityPolicy("n", false)).toContain("'unsafe-eval'");
  });

  it("issues a fresh base64 nonce of 16 bytes", () => {
    const a = createNonce();
    expect(Buffer.from(a, "base64")).toHaveLength(16);
    expect(createNonce()).not.toBe(a);
  });
});

describe("API origin check", () => {
  const expected = expectedOrigin("https://mizuki-clinic.jp");
  const write = (origin: string | null, referer: string | null = null, method = "POST") =>
    isAllowedApiWrite({ method, pathname: "/api/news", origin, referer, expected });

  it("accepts same-origin writes and rejects other sites", () => {
    expect(write("https://mizuki-clinic.jp")).toBe(true);
    expect(write("https://evil.example")).toBe(false);
    expect(write("https://mizuki-clinic.jp.evil.example")).toBe(false);
    expect(write("http://mizuki-clinic.jp")).toBe(false);
  });

  it("falls back to Referer and rejects writes with neither header", () => {
    expect(write(null, "https://mizuki-clinic.jp/portal-admin/news")).toBe(true);
    expect(write(null, "https://evil.example/")).toBe(false);
    expect(write(null, null)).toBe(false);
    expect(write("null")).toBe(false);
  });

  it("ignores safe methods and non-API paths, and fails closed without a site URL", () => {
    expect(write("https://evil.example", null, "GET")).toBe(true);
    expect(
      isAllowedApiWrite({ method: "POST", pathname: "/portal-login", origin: null, referer: null, expected })
    ).toBe(true);
    expect(
      isAllowedApiWrite({
        method: "DELETE",
        pathname: "/api/blog/1",
        origin: "https://mizuki-clinic.jp",
        referer: null,
        expected: expectedOrigin(undefined),
      })
    ).toBe(false);
  });
});

describe("admin IP restriction", () => {
  it("parses a comma separated list and drops invalid entries", () => {
    expect(parseAllowedIps(" 203.0.113.1, nope ,2001:db8::1,")).toEqual(["203.0.113.1", "2001:db8::1"]);
    expect(parseAllowedIps(undefined)).toEqual([]);
  });

  it("is disabled when the allow list is empty", () => {
    expect(isAllowedAdminIp([], "unknown")).toBe(true);
    expect(isAllowedAdminIp(["203.0.113.1"], "203.0.113.1")).toBe(true);
    expect(isAllowedAdminIp(["203.0.113.1"], "198.51.100.2")).toBe(false);
  });

  it.each([
    ["GET", "/portal-admin", true],
    ["GET", "/portal-admin/news", true],
    ["POST", "/portal-login", true],
    ["POST", "/api/admin/upload", true],
    ["POST", "/api/news", true],
    ["PUT", "/api/blog/3", true],
    ["GET", "/api/email", true],
    ["DELETE", "/api/email", true],
    ["POST", "/api/auth/signout", true],
    ["GET", "/api/news", false],
    ["GET", "/api/blog/3", false],
    ["POST", "/api/email", false],
    ["GET", "/api/auth/session", false],
    ["GET", "/api/blog/backup", false],
    ["GET", "/portal-adminx", false],
    ["GET", "/", false],
  ])("%s %s is admin surface: %s", (method, pathname, expected) => {
    expect(isAdminSurface(method, pathname)).toBe(expected);
  });
});

describe("two-factor secrets", () => {
  const key = deriveMfaKey("test-auth-secret-of-sufficient-length");

  it("round-trips and uses a fresh IV each time", () => {
    const sealed = encryptMfaSecret(key, "JBSWY3DPEHPK3PXP");
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(encryptMfaSecret(key, "JBSWY3DPEHPK3PXP")).not.toBe(sealed);
    expect(decryptMfaSecret(key, sealed)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("rejects tampering and a different key", () => {
    const sealed = encryptMfaSecret(key, "JBSWY3DPEHPK3PXP");
    const [version, iv, tag, body] = sealed.split(".");
    const flipped = Buffer.from(body, "base64url");
    flipped[0] ^= 0xff;
    expect(() => decryptMfaSecret(key, [version, iv, tag, flipped.toString("base64url")].join("."))).toThrow();
    expect(() => decryptMfaSecret(deriveMfaKey("another-secret"), sealed)).toThrow();
    expect(() => decryptMfaSecret(key, "v0.a.b.c")).toThrow();
  });

  it("requires a configured AUTH_SECRET", () => {
    expect(() => deriveMfaKey("")).toThrow("AUTH_SECRET");
  });

  it("requires two-factor for ADMIN only", () => {
    expect(isMfaRequired("ADMIN")).toBe(true);
    expect(isMfaRequired("EDITOR")).toBe(false);
    expect(isMfaRequired(undefined)).toBe(false);
  });

  it("builds an authenticator QR code as a data URL", () => {
    const enrollment = totpEnrollment("admin@example.com", "JBSWY3DPEHPK3PXP");
    expect(enrollment.uri).toContain("otpauth://totp/");
    expect(enrollment.uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(enrollment.qrDataUrl.startsWith("data:image/")).toBe(true);
  });
});

describe("security notification mail", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("sends login notices to the account owner", () => {
    const mail = buildSecurityMail({
      kind: "login",
      email: "admin@example.com",
      ip: "203.0.113.1",
      userAgent: "Mozilla/5.0\r\nBcc: x@evil.example",
      at: new Date("2026-11-02T00:00:00Z"),
    });
    expect(mail.to).toEqual(["admin@example.com"]);
    expect(mail.text).toContain("2026/11/2 9:00:00");
    expect(mail.text).toContain("203.0.113.1");
    expect(mail.text).not.toContain("\r");
    expect(mail.text).not.toMatch(/\nBcc:/);
  });

  it("sends lockouts to the alert address and only to accounts that exist", () => {
    process.env.SECURITY_ALERT_EMAIL = "security@example.com";
    const unknown = buildSecurityMail({ kind: "locked", email: "nobody@example.com", ip: "198.51.100.2", accountExists: false });
    expect(unknown.to).toEqual(["security@example.com"]);
    expect(unknown.text).toContain("（登録なし）");

    const known = buildSecurityMail({ kind: "locked", email: "admin@example.com", ip: "198.51.100.2", accountExists: true });
    expect(known.to).toEqual(["admin@example.com", "security@example.com"]);
  });

  it("falls back to the contact address for alerts", () => {
    delete process.env.SECURITY_ALERT_EMAIL;
    process.env.CONTACT_TO_EMAIL = "info@example.com";
    const mail = buildSecurityMail({ kind: "locked", email: "x@example.com", ip: "unknown", accountExists: false });
    expect(mail.to).toEqual(["info@example.com"]);
  });
});
