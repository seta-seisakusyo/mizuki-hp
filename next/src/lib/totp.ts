import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
const SECRET_BYTES = 20;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function decodeBase32(text: string): Buffer {
  const normalized = text.replace(/[\s=-]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error("Invalid Base32 secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export const generateTotpSecret = () => encodeBase32(randomBytes(SECRET_BYTES));

export const totpStep = (now: Date) => Math.floor(now.getTime() / 1000 / TOTP_PERIOD_SECONDS);

// RFC 4226 の動的切り捨て
export function hotp(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, "0");
}

export const totp = (secret: string, now = new Date()) => hotp(secret, totpStep(now));

export const normalizeTotpCode = (code: string) => code.normalize("NFKC").replace(/\s/g, "");

const sameCode = (a: string, b: string) => timingSafeEqual(Buffer.from(a), Buffer.from(b));

// 前後1区間の時刻のずれを許容し、使用済みの区間以前のコードは拒否する
export function verifyTotp(secret: string, input: string, { now = new Date(), lastStep = null as number | null } = {}): number | null {
  const code = normalizeTotpCode(input);
  if (!/^\d{6}$/.test(code)) return null;
  const current = totpStep(now);
  for (const step of [current - 1, current, current + 1]) {
    if (lastStep !== null && step <= lastStep) continue;
    if (sameCode(hotp(secret, step), code)) return step;
  }
  return null;
}

export function otpauthUri({ issuer, account, secret }: { issuer: string; account: string; secret: string }): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: String(TOTP_DIGITS), period: String(TOTP_PERIOD_SECONDS) });
  return `otpauth://totp/${label}?${params}`;
}
