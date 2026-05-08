import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@/lib/db";
import xss from "xss";

const prisma = getPrismaClient();

/**
 * APIエラーレスポンスを生成
 */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * IDパラメータを検証して数値に変換
 * 数字のみで構成された文字列のみ受け付け、"1abc"や"1.5"は拒否
 * @returns パースされたID、または無効な場合はnull
 */
export function parseId(id: string): number | null {
  // 数字のみで構成されているか厳密にチェック
  if (!/^\d+$/.test(id)) {
    return null;
  }
  const parsed = Number(id);
  if (parsed <= 0 || !Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * 管理者権限をチェック
 * @returns ユーザーが管理者の場合はtrue、そうでなければエラーレスポンス
 */
export async function checkAdminAuth(): Promise<
  | { isAdmin: true; email: string }
  | { isAdmin: false; response: NextResponse }
> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      isAdmin: false,
      response: apiError("未ログインです", 401),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      isAdmin: false,
      response: apiError("権限がありません", 403),
    };
  }

  return { isAdmin: true, email: session.user.email };
}

/**
 * 値を再帰的にサニタイズ
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === "object" && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  // number, boolean, null はそのまま返す
  return value;
}

/**
 * JSON配列内の文字列を再帰的にサニタイズ（Prisma Json型互換）
 * ネストしたオブジェクトや配列も処理
 */
export function sanitizeContents(contents: unknown): object[] | object | string {
  const sanitized = sanitizeValue(contents);
  if (Array.isArray(sanitized)) {
    return sanitized as object[];
  }
  if (typeof sanitized === "object" && sanitized !== null) {
    return sanitized as object;
  }
  return String(sanitized);
}

/**
 * 文字列をXSSサニタイズ（undefinedを維持）
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (typeof value === "string") {
    return xss(value);
  }
  return undefined;
}

/**
 * URLを検証してサニタイズ
 * http:// または https:// スキームのみ許可
 * javascript:, data:, vbscript: などの危険なスキームを拒否
 * @returns サニタイズされたURL、または無効な場合はnull
 */
export function sanitizeUrl(value: string | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    const url = new URL(value);
    // http と https のみ許可
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    // XSSサニタイズしてから返す
    return xss(url.href);
  } catch {
    // 無効なURL形式
    return null;
  }
}
