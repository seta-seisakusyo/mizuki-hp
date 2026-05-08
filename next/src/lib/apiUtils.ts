import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import xss from "xss";
import { INPUT_LIMITS } from "@/lib/validation";

// 許可されたニュースカラー
const ALLOWED_NEWS_COLORS = ["black", "red", "blue", "green", "orange"] as const;
export type NewsColor = typeof ALLOWED_NEWS_COLORS[number];

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

/**
 * ニュースのカラーを検証
 * ホワイトリストにないカラーはデフォルト値に変換
 */
export function validateNewsColor(color: string | undefined): NewsColor {
  if (color && ALLOWED_NEWS_COLORS.includes(color as NewsColor)) {
    return color as NewsColor;
  }
  return "black";
}

/**
 * 日付文字列を検証
 * 合理的な範囲（過去10年〜未来1年）内かチェック
 */
export function validateDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const minDate = new Date(now.getFullYear() - 10, 0, 1);
    const maxDate = new Date(now.getFullYear() + 1, 11, 31);

    if (date < minDate || date > maxDate) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * ブログ入力の長さを検証
 */
export function validateBlogInput(title: string, content: string): string | null {
  if (title.length > INPUT_LIMITS.BLOG_TITLE_MAX) {
    return `タイトルは${INPUT_LIMITS.BLOG_TITLE_MAX}文字以内で入力してください。`;
  }
  if (content.length > INPUT_LIMITS.BLOG_CONTENT_MAX) {
    return `本文は${INPUT_LIMITS.BLOG_CONTENT_MAX}文字以内で入力してください。`;
  }
  return null;
}

/**
 * ニュース入力の長さを検証
 */
export function validateNewsInput(title: string, contents: unknown): string | null {
  if (title.length > INPUT_LIMITS.NEWS_TITLE_MAX) {
    return `タイトルは${INPUT_LIMITS.NEWS_TITLE_MAX}文字以内で入力してください。`;
  }
  const contentsStr = JSON.stringify(contents);
  if (contentsStr.length > INPUT_LIMITS.NEWS_CONTENT_MAX) {
    return `内容は${INPUT_LIMITS.NEWS_CONTENT_MAX}文字以内で入力してください。`;
  }
  return null;
}
