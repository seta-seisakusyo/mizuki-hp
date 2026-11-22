import { NextResponse } from "next/server";
import xss from "xss";

// 入力の検証（必須・文字数・日付・色など）は @/lib/apiSchemas に集約している。

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

// 権限チェックは @/lib/staff の requirePermission() を使う（#193）。

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
 * 画像URLを検証してサニタイズ
 * /uploads/ で始まる相対パスまたは http(s):// の絶対URLを許可
 * 日本語などUnicodeファイル名もサポート（既存データ対応）
 * @returns サニタイズされたURL、または無効な場合はnull
 */
export function sanitizeImageUrl(value: string | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  // /uploads/ で始まる相対パスを許可
  if (trimmed.startsWith("/uploads/")) {
    // URLデコードしてパストラバーサル攻撃をチェック
    let decoded: string;
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      // デコード失敗は無効なURL
      return null;
    }

    // パストラバーサル攻撃を防ぐ（デコード後にチェック）
    if (decoded.includes("..") || decoded.includes("//")) {
      return null;
    }

    // /uploads/ から始まり、nullバイトを含まないことを確認
    if (!decoded.startsWith("/uploads/") || decoded.includes("\0")) {
      return null;
    }

    // XSSサニタイズして返す（元のエンコード済み値を使用）
    return xss(trimmed);
  }

  // 絶対URLの場合は既存のsanitizeUrlを使用
  return sanitizeUrl(value);
}
