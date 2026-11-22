import type { UserRole } from "@prisma/client";

/**
 * ロールと権限の対応表（#193）
 *
 * ミドルウェア・管理画面のレイアウト・API・メニューの表示は、すべてここを参照する。
 * DB を読み込まないので、ミドルウェアやクライアントコンポーネントからも使える。
 */

/** 管理画面を使えるロール */
export const STAFF_ROLES = ["ADMIN", "EDITOR"] as const satisfies readonly UserRole[];

export const PERMISSIONS = {
  /** 管理画面を開く */
  "admin:access": ["ADMIN", "EDITOR"],
  /** お知らせの作成・編集・削除 */
  "news:write": ["ADMIN", "EDITOR"],
  /** 俳句の作成・編集・削除、バックアップの取得 */
  "blog:write": ["ADMIN", "EDITOR"],
  /** 画像のアップロード */
  "image:upload": ["ADMIN"],
  /** お問い合わせの閲覧・削除（個人情報のため ADMIN のみ） */
  "inquiry:manage": ["ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

/** 二要素認証を設定するまで管理画面を使えないロール */
export const MFA_REQUIRED_ROLES = ["ADMIN"] as const satisfies readonly UserRole[];

const includesRole = (roles: readonly string[], role: unknown): role is UserRole =>
  typeof role === "string" && roles.includes(role);

export function isStaffRole(role: unknown): role is (typeof STAFF_ROLES)[number] {
  return includesRole(STAFF_ROLES, role);
}

export function can(role: unknown, permission: Permission): boolean {
  return includesRole(PERMISSIONS[permission], role);
}

export function isMfaRequired(role: unknown): boolean {
  return includesRole(MFA_REQUIRED_ROLES, role);
}
