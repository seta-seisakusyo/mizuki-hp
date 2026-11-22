import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, parseId, sanitizeString, sanitizeImageUrl } from "@/lib/apiUtils";
import { isRecordNotFound, parseJsonBody } from "@/lib/apiRequest";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";
import type { RouteParams, IdParams } from "@/types/models";
import { blogUpdateSchema } from "@/lib/apiSchemas";
import { deleteUploadedImageIfUnused } from "@/lib/uploads";

const NOT_FOUND_MESSAGE = "記事が見つかりません";

// =====================
// 単一記事取得 API（管理者のみ）
// =====================
export async function GET(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const parsedId = parseId((await params).id);
  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  // 管理者権限チェック（PUT/DELETEと統一）
  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: parsedId },
    });

    if (!blog) {
      return apiError(NOT_FOUND_MESSAGE, 404);
    }

    return NextResponse.json(blog);
  } catch (error) {
    logger.error("取得エラー:", error);
    return apiError("取得に失敗しました", 500);
  }
}

// =====================
// 削除 API
// =====================
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
    const deleted = await prisma.blog.delete({
      where: { id: parsedId },
    });
    await deleteUploadedImageIfUnused(deleted.imageUrl);
    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(NOT_FOUND_MESSAGE, 404);
    logger.error("削除エラー:", error);
    return apiError("削除に失敗しました", 500);
  }
}

// =====================
// 編集 API
// =====================
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

  // 文字数・画像の位置は blogUpdateSchema で検証済み（部分更新のため各項目は任意）
  const parsed = await parseJsonBody(request, blogUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { title, content, imageUrl, imagePosition } = parsed.data;

  try {
    const previous = await prisma.blog.findUnique({ where: { id: parsedId } });
    if (!previous) return apiError(NOT_FOUND_MESSAGE, 404);

    const updated = await prisma.blog.update({
      where: { id: parsedId },
      data: {
        title: sanitizeString(title),
        content: sanitizeString(content),
        imageUrl: imageUrl !== undefined ? sanitizeImageUrl(imageUrl ?? undefined) : undefined,
        imagePosition,
      },
    });
    if (previous.imageUrl !== updated.imageUrl) {
      await deleteUploadedImageIfUnused(previous.imageUrl);
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (isRecordNotFound(error)) return apiError(NOT_FOUND_MESSAGE, 404);
    logger.error("更新エラー:", error);
    return apiError("更新に失敗しました", 500);
  }
}
