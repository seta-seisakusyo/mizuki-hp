import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, parseId, sanitizeString, sanitizeContents, sanitizeUrl } from "@/lib/apiUtils";
import { isRecordNotFound, parseJsonBody } from "@/lib/apiRequest";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";
import type { RouteParams, IdParams } from "@/types/models";
import { newsUpdateSchema } from "@/lib/apiSchemas";

const NOT_FOUND_MESSAGE = "お知らせが見つかりません";

export async function GET(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const parsedId = parseId((await params).id);
  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  try {
    const news = await prisma.news.findUnique({
      where: { id: parsedId },
    });

    if (!news) {
      return apiError(NOT_FOUND_MESSAGE, 404);
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
  const parsedId = parseId((await params).id);
  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  // 文字数・日付の範囲・色は newsUpdateSchema で検証済み（部分更新のため各項目は任意）
  const parsed = await parseJsonBody(request, newsUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { title, date, contents, url, color, pinned } = parsed.data;

  try {
    const updated = await prisma.news.update({
      where: { id: parsedId },
      data: {
        title: sanitizeString(title),
        date,
        contents: contents !== undefined ? sanitizeContents(contents) : undefined,
        url: url !== undefined ? (url ? sanitizeUrl(url) : null) : undefined,
        color,
        pinned,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(NOT_FOUND_MESSAGE, 404);
    logger.error("更新エラー:", error);
    return apiError("更新に失敗しました", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const parsedId = parseId((await params).id);
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
    if (isRecordNotFound(error)) return apiError(NOT_FOUND_MESSAGE, 404);
    logger.error("削除エラー:", error);
    return apiError("削除に失敗しました", 500);
  }
}
