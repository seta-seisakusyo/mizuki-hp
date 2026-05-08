import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, parseId, sanitizeString } from "@/lib/apiUtils";
import { NextResponse } from "next/server";
import type { RouteParams, IdParams } from "@/types/models";

// =====================
// 単一記事取得 API
// =====================
export async function GET(
  request: Request,
  { params }: RouteParams<IdParams>
) {
  const { id } = await params;
  const parsedId = parseId(id);

  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  const session = await auth();
  if (!session) {
    return apiError("未ログインです", 401);
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: parsedId },
    });

    if (!blog) {
      return apiError("記事が見つかりません", 404);
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("取得エラー:", error);
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
    await prisma.blog.delete({
      where: { id: parsedId },
    });
    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("削除エラー:", error);
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
  const { id } = await params;
  const parsedId = parseId(id);

  if (parsedId === null) {
    return apiError("無効なIDです", 400);
  }

  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("無効なJSONです", 400);
  }

  const { title, content, imageUrl, imagePosition } = body as {
    title?: string;
    content?: string;
    imageUrl?: string;
    imagePosition?: string;
  };

  try {
    const updated = await prisma.blog.update({
      where: { id: parsedId },
      data: {
        title: title ? sanitizeString(title) : undefined,
        content: content ? sanitizeString(content) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        imagePosition: imagePosition || undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新エラー:", error);
    return apiError("更新に失敗しました", 500);
  }
}
