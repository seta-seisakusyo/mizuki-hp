import { prisma } from "@/lib/db";
import { apiError, sanitizeString, sanitizeContents, sanitizeUrl } from "@/lib/apiUtils";
import { requirePermission } from "@/lib/staff";
import { parseJsonBody } from "@/lib/apiRequest";
import { checkRateLimit, rateLimitResponse, PUBLIC_API_LIMIT } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { newsCreateSchema } from "@/lib/apiSchemas";

// ページネーション設定
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export async function GET(req: NextRequest) {
  // レート制限チェック
  const rateLimit = await checkRateLimit(req, PUBLIC_API_LIMIT);
  if (rateLimit.limited) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  // ページネーションパラメータ
  const { searchParams } = new URL(req.url);
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
    : DEFAULT_PAGE_SIZE;
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
  const authResult = await requirePermission("news:write");
  if (!authResult.ok) {
    return authResult.response;
  }

  // 必須・文字数・日付の範囲・色は newsCreateSchema で検証済み
  const parsed = await parseJsonBody(req, newsCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, title, contents, url, color, pinned } = parsed.data;

  try {
    const news = await prisma.news.create({
      data: {
        date,
        title: sanitizeString(title) ?? "",
        contents: sanitizeContents(contents),
        url: url ? sanitizeUrl(url) : null,
        color,
        pinned,
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    logger.error("お知らせ作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
