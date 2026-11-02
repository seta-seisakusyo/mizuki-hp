"use server";

import { OTP_INVALID, OTP_REQUIRED, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import {
  checkRateLimitKey,
  getTrustedClientIp,
  LOGIN_ACCOUNT_LIMIT,
  LOGIN_IP_LIMIT,
  loginAccountRateLimitKey,
} from "@/lib/rateLimit";
import { sendSecurityNotification } from "@/lib/securityNotify";
import { LoginSchema } from "@/lib/validation";
import { AuthError, CredentialsSignin } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { headers } from "next/headers";
import * as z from "zod";

const AUTH_ERROR_MESSAGE = "メールアドレスまたはパスワードが正しくありません。";
const RATE_LIMIT_MESSAGE = "ログイン試行回数の上限に達しました。15分後に再度お試しください。";
const OTP_INVALID_MESSAGE = "確認コードが正しくありません。";

type LoginResult = { success: boolean; messages?: string[]; otpRequired?: boolean };

const hasCode = (error: unknown, code: string) =>
  error instanceof CredentialsSignin && error.code === code;

/** Notify once per lockout window, not on every rejected attempt. */
async function notifyLockedOnce(email: string, ip: string) {
  const key = `${loginAccountRateLimitKey(email)}:notified`;
  const first = await checkRateLimitKey(key, { max: 1, windowMs: LOGIN_ACCOUNT_LIMIT.windowMs });
  if (first.limited) return;

  const accountExists = Boolean(
    await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } })
  );
  void sendSecurityNotification({ kind: "locked", email, ip, accountExists });
}

export const login = async (data: z.infer<typeof LoginSchema>): Promise<LoginResult> => {
  const headersList = await headers();
  const clientIp = getTrustedClientIp(headersList);
  const rateLimit = await checkRateLimitKey(`login:${clientIp}`, LOGIN_IP_LIMIT);
  if (rateLimit.limited) return { success: false, messages: [RATE_LIMIT_MESSAGE] };

  const validateData = LoginSchema.safeParse(data);
  if (!validateData.success) {
    return { success: false, messages: ["入力内容に不備があります。"] };
  }

  const { email, password, code } = validateData.data;

  const accountRateLimit = await checkRateLimitKey(
    loginAccountRateLimitKey(email),
    LOGIN_ACCOUNT_LIMIT
  );
  if (accountRateLimit.limited) {
    await notifyLockedOnce(email, clientIp);
    return { success: false, messages: [RATE_LIMIT_MESSAGE] };
  }

  try {
    await signIn("credentials", { email, password, code: code ?? "", redirect: false });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (hasCode(error, OTP_REQUIRED)) {
      return { success: false, otpRequired: true };
    }
    if (hasCode(error, OTP_INVALID)) {
      return { success: false, otpRequired: true, messages: [OTP_INVALID_MESSAGE] };
    }
    if (error instanceof AuthError) {
      return { success: false, messages: [AUTH_ERROR_MESSAGE] };
    }
    return {
      success: false,
      messages: ["サーバーエラーが発生しました。管理者へお問い合わせください。"],
    };
  }

  void sendSecurityNotification({
    kind: "login",
    email: email.trim().toLowerCase(),
    ip: clientIp,
    userAgent: headersList.get("user-agent") ?? "",
  });

  return { success: true };
};
