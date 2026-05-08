import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, parseId, sanitizeString, sanitizeContents, sanitizeUrl, validateDate, validateNewsTitle, validateNewsContents, validateNewsColor } from "@/lib/apiUtils";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";
import type { RouteParams, IdParams } from "@/types/models";

export async function GET(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const { id } = await params;
  const parsedId = parseId(id);

  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  try {
    const news = await prisma.news.findUnique({
      where: { id: parsedId },
    });

    if (!news) {
      return apiError("お知らせが見つかりません", 404);
    }

    return NextResponse.json(news);
  } catch (error) {
    logger.error("取得エラー:", error);
    return apiError("取得に失敗しました", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const { id } = await params;
  const parsedId = parseId(id);

  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return apiError("無効なJSONです", 400);
  }

  const { title, date, contents, url, color, pinned } = data as {
    title?: string;
    date?: string;
    contents?: unknown;
    url?: string;
    color?: string;
    pinned?: boolean;
  };

  // 入力長バリデーション（個別フィールド検証：部分更新対応）
  if (title !== undefined) {
    const titleError = validateNewsTitle(title);
    if (titleError) {
      return apiError(titleError, 400);
    }
  }
  if (contents !== undefined) {
    const contentsError = validateNewsContents(contents);
    if (contentsError) {
      return apiError(contentsError, 400);
    }
  }

  // 日付バリデーション
  let validatedDate: Date | undefined;
  if (date) {
    const parsedDate = validateDate(date);
    if (!parsedDate) {
      return apiError("無効な日付です", 400);
    }
    validatedDate = parsedDate;
  }

  try {
    const updated = await prisma.news.update({
      where: { id: parsedId },
      data: {
        title: sanitizeString(title),
        date: validatedDate,
        contents: contents !== undefined ? sanitizeContents(contents) : undefined,
        url: url !== undefined ? (url ? sanitizeUrl(url) : null) : undefined,
        color: color !== undefined ? validateNewsColor(color) : undefined,
        pinned: pinned ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    logger.error("更新エラー:", error);
    return apiError("更新に失敗しました", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const { id } = await params;
  const parsedId = parseId(id);

  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  try {
    await prisma.news.delete({
      where: { id: parsedId },
    });
    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    logger.error("削除エラー:", error);
    return apiError("削除に失敗しました", 500);
  }
}
