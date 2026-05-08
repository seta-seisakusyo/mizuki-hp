import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, sanitizeString, sanitizeContents, sanitizeUrl, validateNewsColor, validateDate, validateNewsInput } from "@/lib/apiUtils";
import { checkRateLimit, rateLimitResponse, PUBLIC_API_LIMIT } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// ページネーション設定
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export async function GET(req: NextRequest) {
  // レート制限チェック
  const rateLimit = checkRateLimit(req, PUBLIC_API_LIMIT);
  if (rateLimit.limited) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  // ページネーションパラメータ
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10)));
  const skip = (page - 1) * limit;

  try {
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        orderBy: [{ pinned: "desc" }, { date: "desc" }],
        skip,
        take: limit,
      }),
      prisma.news.count(),
    ]);
    return NextResponse.json({
      news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("お知らせ取得エラー:", error);
    return apiError("取得に失敗しました", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("無効なJSONです", 400);
  }

  const { date, title, contents, url, color, pinned } = body as {
    date?: string;
    title?: string;
    contents?: unknown;
    url?: string;
    color?: string;
    pinned?: boolean;
  };

  if (!date || !title || !contents) {
    return apiError("日付、タイトル、内容は必須です", 400);
  }

  // 日付バリデーション
  const validatedDate = validateDate(date);
  if (!validatedDate) {
    return apiError("無効な日付です。過去10年〜未来1年の範囲で指定してください。", 400);
  }

  // 入力長バリデーション
  const lengthError = validateNewsInput(title, contents);
  if (lengthError) {
    return apiError(lengthError, 400);
  }

  try {
    const sanitizedTitle = sanitizeString(title);
    const sanitizedContents = sanitizeContents(contents);

    const news = await prisma.news.create({
      data: {
        date: validatedDate,
        title: sanitizedTitle ?? "",
        contents: sanitizedContents,
        url: url ? sanitizeUrl(url) : null,
        color: validateNewsColor(color),
        pinned: pinned ?? false,
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    logger.error("お知らせ作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
