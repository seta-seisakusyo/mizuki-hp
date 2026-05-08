import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, parseId, sanitizeString, sanitizeContents, sanitizeUrl } from "@/lib/apiUtils";
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
    console.error("取得エラー:", error);
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

  try {
    const updated = await prisma.news.update({
      where: { id: parsedId },
      data: {
        title: sanitizeString(title),
        date: date ? new Date(date) : undefined,
        contents: contents !== undefined ? sanitizeContents(contents) : undefined,
        url: url !== undefined ? (url ? sanitizeUrl(url) : null) : undefined,
        color: color || "black",
        pinned: pinned ?? false,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新エラー:", error);
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
    console.error("削除エラー:", error);
    return apiError("削除に失敗しました", 500);
  }
}
