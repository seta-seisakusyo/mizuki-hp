"use server";

import { signIn } from "@/auth";
import * as z from "zod";
import { LoginSchema } from "@/lib/validation";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { headers } from "next/headers";

// ログイン試行回数制限（インメモリ）
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15分

// ユーザー列挙を防ぐ統一エラーメッセージ
const AUTH_ERROR_MESSAGE = "メールアドレスまたはパスワードが正しくありません。";

function getClientIp(headersList: Headers): string {
  const cfIp = headersList.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;

  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

function checkLoginRateLimit(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
    return { limited: false, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  entry.count += 1;
  return {
    limited: entry.count > MAX_LOGIN_ATTEMPTS,
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - entry.count),
  };
}

// 定期的に期限切れエントリを削除
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (now > entry.resetTime) {
      loginAttempts.delete(key);
    }
  }
}, 60_000);

export const login = async (data: z.infer<typeof LoginSchema>) => {
  // レート制限チェック
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimit = checkLoginRateLimit(clientIp);

  if (rateLimit.limited) {
    return {
      success: false,
      messages: ["ログイン試行回数の上限に達しました。15分後に再度お試しください。"]
    };
  }

  const validateData = LoginSchema.safeParse(data);

  if (!validateData.success) {
    return { success: false, messages: ["入力内容に不備があります。"] };
  }

  const { email, password } = validateData.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      // next-auth が成功時に throw する NEXT_REDIRECT は再 throw して正常に処理させる
      throw error;
    }
    if (error instanceof AuthError) {
      // ユーザー列挙を防ぐため、全ての認証エラーで同じメッセージを返す
      return { success: false, messages: [AUTH_ERROR_MESSAGE] };
    }
    return { success: false, messages: ["サーバーエラーが発生しました。管理者へ問い合わせてください。"] };
  }

  return { success: true };
};
