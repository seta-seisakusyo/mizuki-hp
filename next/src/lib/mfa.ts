import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import qrcode from "qrcode-generator";
import { otpauthUri } from "@/lib/totp";

export const MFA_ISSUER = "mizuki-clinic.jp";

const CIPHER = "aes-256-gcm";
const CIPHER_VERSION = "v1";

/** Roles that must have two-factor authentication before using the admin. */
export const MFA_REQUIRED_ROLES = ["ADMIN"] as const;

export function isMfaRequired(role: string | null | undefined): boolean {
  return MFA_REQUIRED_ROLES.includes(role as (typeof MFA_REQUIRED_ROLES)[number]);
}

/** Derive the TOTP encryption key from AUTH_SECRET so no new secret is needed. */
export function deriveMfaKey(authSecret: string | undefined = process.env.AUTH_SECRET): Buffer {
  if (!authSecret) throw new Error("AUTH_SECRET is not set");
  return Buffer.from(hkdfSync("sha256", authSecret, "mizuki-hp-mfa", "totp-secret", 32));
}

export function encryptMfaSecret(key: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER, key, iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [CIPHER_VERSION, iv, cipher.getAuthTag(), body]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function decryptMfaSecret(key: Buffer, sealed: string): string {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== CIPHER_VERSION || !iv || !tag || !body) {
    throw new Error("Invalid sealed TOTP secret");
  }
  const decipher = createDecipheriv(CIPHER, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}

export function totpEnrollment(account: string, secret: string) {
  const uri = otpauthUri({ issuer: MFA_ISSUER, account, secret });
  const qr = qrcode(0, "M");
  qr.addData(uri);
  qr.make();
  return { secret, uri, qrDataUrl: qr.createDataURL(4, 4) };
}
