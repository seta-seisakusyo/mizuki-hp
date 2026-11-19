"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { decryptMfaSecret, deriveMfaKey, encryptMfaSecret, isMfaRequired, totpEnrollment } from "@/lib/mfa";
import { checkRateLimitKey, getTrustedClientIp } from "@/lib/rateLimit";
import { sendSecurityNotification } from "@/lib/securityNotify";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";
import { headers } from "next/headers";

type ActionResult = { success: true } | { success: false; message: string };

const CODE_INVALID = "確認コードが正しくありません。時刻のずれがないか確認して、もう一度お試しください。";
const RATE_LIMITED = "試行回数の上限に達しました。15分後に再度お試しください。";

async function currentStaff() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      totpSecret: true,
      totpPendingSecret: true,
      totpEnabledAt: true,
      totpLastStep: true,
    },
  });
  if (!user?.email || (user.role !== "ADMIN" && user.role !== "EDITOR")) return null;
  return { ...user, email: user.email };
}

async function isRateLimited(userId: string) {
  return (await checkRateLimitKey(`mfa:${userId}`, { max: 10, windowMs: 15 * 60 * 1000 })).limited;
}

/**
 * Issue a new pending secret. The active secret, if any, stays in force until
 * the new one is confirmed, and replacing it requires a current code so a
 * hijacked session alone cannot move the second factor to another device.
 */
export async function startTotpSetup(currentCode?: string): Promise<
  { success: true; secret: string; qrDataUrl: string } | { success: false; message: string }
> {
  const user = await currentStaff();
  if (!user) return { success: false, message: "権限がありません。" };
  if (await isRateLimited(user.id)) return { success: false, message: RATE_LIMITED };

  if (user.totpEnabledAt && user.totpSecret) {
    const active = decryptMfaSecret(deriveMfaKey(), user.totpSecret);
    if (verifyTotp(active, String(currentCode ?? ""), { lastStep: user.totpLastStep }) === null) {
      return { success: false, message: "現在の確認コードが正しくありません。" };
    }
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpPendingSecret: encryptMfaSecret(deriveMfaKey(), secret) },
  });

  const { qrDataUrl } = totpEnrollment(user.email, secret);
  return { success: true, secret, qrDataUrl };
}

/** Promote the pending secret once the user proves the authenticator works. */
export async function confirmTotpSetup(code: string): Promise<ActionResult> {
  const user = await currentStaff();
  if (!user) return { success: false, message: "権限がありません。" };
  if (await isRateLimited(user.id)) return { success: false, message: RATE_LIMITED };
  if (!user.totpPendingSecret) {
    return { success: false, message: "設定を最初からやり直してください。" };
  }

  const key = deriveMfaKey();
  const step = verifyTotp(decryptMfaSecret(key, user.totpPendingSecret), String(code));
  if (step === null) return { success: false, message: CODE_INVALID };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpSecret: user.totpPendingSecret,
      totpPendingSecret: null,
      totpEnabledAt: new Date(),
      totpLastStep: step,
    },
  });

  void sendSecurityNotification({
    kind: "mfa-enabled",
    email: user.email,
    ip: getTrustedClientIp(await headers()),
  });
  return { success: true };
}

/** Roles that require two-factor authentication cannot turn it off. */
export async function disableTotp(code: string): Promise<ActionResult> {
  const user = await currentStaff();
  if (!user) return { success: false, message: "権限がありません。" };
  if (isMfaRequired(user.role)) {
    return { success: false, message: "管理者は二要素認証を解除できません。" };
  }
  if (await isRateLimited(user.id)) return { success: false, message: RATE_LIMITED };
  if (!user.totpSecret || !user.totpEnabledAt) return { success: true };

  const secret = decryptMfaSecret(deriveMfaKey(), user.totpSecret);
  if (verifyTotp(secret, String(code), { lastStep: user.totpLastStep }) === null) {
    return { success: false, message: CODE_INVALID };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpPendingSecret: null, totpEnabledAt: null, totpLastStep: null },
  });
  return { success: true };
}
