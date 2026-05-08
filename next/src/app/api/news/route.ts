import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, sanitizeString, sanitizeContents, sanitizeUrl } from "@/lib/apiUtils";
import { checkRateLimit, rateLimitResponse, PUBLIC_API_LIMIT } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // レート制限チェック
  const rateLimit = checkRateLimit(req, PUBLIC_API_LIMIT);
  if (rateLimit.limited) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    const news = await prisma.news.findMany({
      orderBy: [{ pinned: "desc" }, { date: "desc" }],
    });
    return NextResponse.json({ news });
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

  try {
    const sanitizedTitle = sanitizeString(title);
    const sanitizedContents = sanitizeContents(contents);

    const news = await prisma.news.create({
      data: {
        date: new Date(date),
        title: sanitizedTitle ?? "",
        contents: sanitizedContents,
        url: url ? sanitizeUrl(url) : null,
        color: color || "black",
        pinned: pinned ?? false,
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    logger.error("お知らせ作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
