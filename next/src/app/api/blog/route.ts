import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, sanitizeString } from "@/lib/apiUtils";
import { NextResponse } from "next/server";

// =====================
// 一覧取得 (GET)
// =====================
export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("GETエラー:", error);
    return apiError("取得に失敗しました", 500);
  }
}

// =====================
// 投稿作成 (POST)
// =====================
export async function POST(request: Request) {
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

  if (!title || !content) {
    return apiError("タイトルと本文は必須です", 400);
  }

  try {
    const newBlog = await prisma.blog.create({
      data: {
        title: sanitizeString(title) ?? "",
        content: sanitizeString(content) ?? "",
        imageUrl: imageUrl || null,
        imagePosition: imagePosition || "center",
      },
    });
    return NextResponse.json(newBlog);
  } catch (error) {
    console.error("作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
