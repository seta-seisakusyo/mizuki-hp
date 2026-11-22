import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can, isMfaRequired, type Permission } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  totpEnabledAt: Date | null;
};

/**
 * ログイン中のユーザーを DB から取得する（未ログイン・DB に無い場合は null）。
 *
 * ロールはセッション（JWT）ではなく DB の値を使う。ロールの変更や削除を即座に反映するため。
 * cache() により、1 回のリクエストの中ではレイアウトとページで呼んでも DB の問い合わせは 1 回（#210）。
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, totpEnabledAt: true },
  });
  if (!user?.email) return null;
  return { ...user, email: user.email };
});

/** 二要素認証が必須のロールで、まだ設定していない */
export function needsMfaSetup(user: Pick<SessionUser, "role" | "totpEnabledAt">): boolean {
  return isMfaRequired(user.role) && !user.totpEnabledAt;
}

export const AUTH_MESSAGES = {
  unauthenticated: "ログインしてください。",
  forbidden: "この操作を行う権限がありません。",
  mfaRequired: "二要素認証の設定が必要です。",
} as const;

export type PermissionResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * API ルートの権限チェック。
 * 未ログインは 401、権限が無い・二要素認証が未設定は 403 を返す。
 */
export async function requirePermission(permission: Permission): Promise<PermissionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: AUTH_MESSAGES.unauthenticated }, { status: 401 }) };
  }
  if (!can(user.role, permission)) {
    return { ok: false, response: NextResponse.json({ error: AUTH_MESSAGES.forbidden }, { status: 403 }) };
  }
  if (needsMfaSetup(user)) {
    return { ok: false, response: NextResponse.json({ error: AUTH_MESSAGES.mfaRequired }, { status: 403 }) };
  }
  return { ok: true, user };
}
