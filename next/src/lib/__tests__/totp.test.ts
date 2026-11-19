import { describe, expect, it } from "vitest";
import { decodeBase32, encodeBase32, generateTotpSecret, hotp, otpauthUri, totp, totpStep, verifyTotp } from "@/lib/totp";

const RFC_SECRET = encodeBase32(Buffer.from("12345678901234567890"));

describe("TOTP", () => {
  it("Base32の往復と区切りや小文字の許容", () => {
    expect(RFC_SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(decodeBase32("gezd gnbv-gy3t qojq gezd gnbv gy3t qojq").toString()).toBe("12345678901234567890");
    expect(() => decodeBase32("GEZ1")).toThrow("Base32");
    expect(decodeBase32(generateTotpSecret())).toHaveLength(20);
  });

  it.each([
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
    [20000000000, "353130"],
  ])("RFC 6238の試験値 %i秒", (seconds, code) => {
    expect(totp(RFC_SECRET, new Date(seconds * 1000))).toBe(code);
  });

  it("前後1区間のずれまで許容し照合した区間を返却", () => {
    const now = new Date(1_700_000_000_000);
    const step = totpStep(now);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step), { now })).toBe(step);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 1), { now })).toBe(step - 1);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step + 1), { now })).toBe(step + 1);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 2), { now })).toBeNull();
  });

  it("使用済みの区間以前と形式外のコードは拒否", () => {
    const now = new Date(1_700_000_000_000);
    const step = totpStep(now);
    const code = hotp(RFC_SECRET, step);
    expect(verifyTotp(RFC_SECRET, code, { now, lastStep: step })).toBeNull();
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step + 1), { now, lastStep: step })).toBe(step + 1);
    expect(verifyTotp(RFC_SECRET, ` ${code.slice(0, 3)} ${code.slice(3)} `, { now })).toBe(step);
    const fullWidth = code.replace(/\d/g, (digit) => String.fromCharCode(digit.charCodeAt(0) + 0xfee0));
    expect(verifyTotp(RFC_SECRET, fullWidth, { now })).toBe(step);
    expect(verifyTotp(RFC_SECRET, "12345", { now })).toBeNull();
    expect(verifyTotp(RFC_SECRET, "abcdef", { now })).toBeNull();
  });

  it("認証アプリ登録用のURI", () => {
    const uri = new URL(otpauthUri({ issuer: "fusetsu.co.jp", account: "user@fusetsu.co.jp", secret: RFC_SECRET }));
    expect(uri.protocol).toBe("otpauth:");
    expect(uri.host).toBe("totp");
    expect(decodeURIComponent(uri.pathname)).toBe("/fusetsu.co.jp:user@fusetsu.co.jp");
    expect(Object.fromEntries(uri.searchParams)).toEqual({ secret: RFC_SECRET, issuer: "fusetsu.co.jp", algorithm: "SHA1", digits: "6", period: "30" });
  });
});
