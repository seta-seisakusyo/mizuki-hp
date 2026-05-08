import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth, sanitizeString, sanitizeUrl, validateBlogInput } from "@/lib/apiUtils";
import { checkRateLimit, rateLimitResponse, PUBLIC_API_LIMIT } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// =====================
// 一覧取得 (GET)
// =====================
export async function GET(req: NextRequest) {
  // レート制限チェック
  const rateLimit = checkRateLimit(req, PUBLIC_API_LIMIT);
  if (rateLimit.limited) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(blogs);
  } catch (error) {
    logger.error("GETエラー:", error);
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

  // 入力長バリデーション
  const lengthError = validateBlogInput(title, content);
  if (lengthError) {
    return apiError(lengthError, 400);
  }

  try {
    const newBlog = await prisma.blog.create({
      data: {
        title: sanitizeString(title) ?? "",
        content: sanitizeString(content) ?? "",
        imageUrl: sanitizeUrl(imageUrl),
        imagePosition: imagePosition || "center",
      },
    });
    return NextResponse.json(newBlog);
  } catch (error) {
    logger.error("作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
