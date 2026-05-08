import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  /** ウィンドウサイズ（ミリ秒）デフォルト: 60秒 */
  windowMs?: number;
  /** 許可するリクエスト数 デフォルト: 60 */
  max?: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * クライアントIPアドレスを取得
 * プロキシ環境を考慮した優先順位:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Real-IP (Nginx等で明示的に設定)
 * 3. X-Forwarded-For の先頭 (標準: クライアント, プロキシ1, プロキシ2... の順)
 */
function getClientIp(req: NextRequest): string {
  // Cloudflare (最も信頼性が高い - エッジで設定される)
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  // X-Real-IP（Nginx等で明示的に設定されたクライアントIP）
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // X-Forwarded-For（標準仕様: 先頭が元のクライアントIP）
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}

// 定期的に期限切れエントリを削除（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

/**
 * レート制限をチェック
 * @returns レート制限に達している場合 true
 */
export function isRateLimited(
  req: NextRequest,
  options: RateLimitOptions = {}
): boolean {
  const result = checkRateLimit(req, options);
  return result.limited;
}

/**
 * レート制限をチェック（詳細情報付き）
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 60_000, max = 60 } = options;
  const ip = getClientIp(req);
  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  // 新規または期限切れの場合
  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(key, newEntry);
    return {
      limited: false,
      remaining: max - 1,
      resetTime: newEntry.resetTime,
    };
  }

  entry.count += 1;
  return {
    limited: entry.count > max,
    remaining: Math.max(0, max - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * レート制限エラーレスポンスを生成
 */
export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { error: "リクエスト制限に達しました。しばらくしてからお試しください。" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

/**
 * 公開APIのデフォルト設定
 * 1分間に60リクエストまで
 */
export const PUBLIC_API_LIMIT: RateLimitOptions = {
  max: 60,
  windowMs: 60 * 1000,
};

/**
 * お問い合わせフォームの設定
 * 1時間に5リクエストまで
 */
export const CONTACT_FORM_LIMIT: RateLimitOptions = {
  max: 5,
  windowMs: 60 * 60 * 1000,
};

/**
 * 管理API の設定
 * 1分間に30リクエストまで
 */
export const ADMIN_API_LIMIT: RateLimitOptions = {
  max: 30,
  windowMs: 60 * 1000,
};
