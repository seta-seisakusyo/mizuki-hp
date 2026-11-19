import {
  blogCreateSchema,
  contactRequestSchema,
  newsCreateSchema,
} from "@/lib/apiSchemas";
import {
  checkRateLimitKey,
  getTrustedClientIp,
  LOGIN_ACCOUNT_LIMIT,
  loginAccountRateLimitKey,
} from "@/lib/rateLimit";
import { INPUT_LIMITS } from "@/lib/validation";
import { describe, expect, it } from "vitest";

describe("request boundary validation", () => {
  it("accepts the documented 50,000-character blog body but rejects more", () => {
    const base = { title: "title", imagePosition: "center" };
    expect(
      blogCreateSchema.safeParse({
        ...base,
        content: "a".repeat(INPUT_LIMITS.BLOG_CONTENT_MAX),
      }).success
    ).toBe(true);
    expect(
      blogCreateSchema.safeParse({
        ...base,
        content: "a".repeat(INPUT_LIMITS.BLOG_CONTENT_MAX + 1),
      }).success
    ).toBe(false);
  });

  it("accepts 2,000 inquiry characters but rejects more", () => {
    const base = {
      name: "name",
      email: "person@example.com",
      phone: "",
      token: "token",
    };
    expect(
      contactRequestSchema.safeParse({
        ...base,
        inquiry: "a".repeat(INPUT_LIMITS.INQUIRY_MAX),
      }).success
    ).toBe(true);
    expect(
      contactRequestSchema.safeParse({
        ...base,
        inquiry: "a".repeat(INPUT_LIMITS.INQUIRY_MAX + 1),
      }).success
    ).toBe(false);
  });

  it("rejects unknown fields and unsupported news colors", () => {
    const base = {
      date: "2026-08-25",
      title: "title",
      contents: { text: "body" },
    };
    expect(newsCreateSchema.safeParse({ ...base, unexpected: true }).success).toBe(false);
    expect(newsCreateSchema.safeParse({ ...base, color: "expression(alert(1))" }).success).toBe(false);
  });
});

describe("rate limiting identity and bounds", () => {
  it("trusts only a syntactically valid X-Real-IP", () => {
    const spoofed = new Headers({
      "cf-connecting-ip": "203.0.113.8",
      "x-forwarded-for": "203.0.113.9",
    });
    expect(getTrustedClientIp(spoofed)).toBe("unknown");

    spoofed.set("x-real-ip", "198.51.100.4");
    expect(getTrustedClientIp(spoofed)).toBe("198.51.100.4");

    spoofed.set("x-real-ip", "not-an-ip");
    expect(getTrustedClientIp(spoofed)).toBe("unknown");
  });

  it("blocks after the configured local fallback limit", async () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect((await checkRateLimitKey(key, { max: 2, windowMs: 60_000 })).limited).toBe(false);
    expect((await checkRateLimitKey(key, { max: 2, windowMs: 60_000 })).limited).toBe(false);
    expect((await checkRateLimitKey(key, { max: 2, windowMs: 60_000 })).limited).toBe(true);
  });

  it("limits login attempts per account regardless of address casing", async () => {
    const email = `admin-${Date.now()}-${Math.random()}@example.com`;
    expect(loginAccountRateLimitKey(` ${email.toUpperCase()} `)).toBe(
      loginAccountRateLimitKey(email)
    );

    const variants = [email, email.toUpperCase(), ` ${email} `];
    for (let i = 0; i < LOGIN_ACCOUNT_LIMIT.max!; i++) {
      const key = loginAccountRateLimitKey(variants[i % variants.length]);
      expect((await checkRateLimitKey(key, LOGIN_ACCOUNT_LIMIT)).limited).toBe(false);
    }
    const key = loginAccountRateLimitKey(email);
    expect((await checkRateLimitKey(key, LOGIN_ACCOUNT_LIMIT)).limited).toBe(true);
  });
});
