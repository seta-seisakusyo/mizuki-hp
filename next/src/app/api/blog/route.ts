import { prisma } from "@/lib/db";
import { apiError, sanitizeString, sanitizeImageUrl } from "@/lib/apiUtils";
import { requirePermission } from "@/lib/staff";
import { parseJsonBody } from "@/lib/apiRequest";
import { checkRateLimit, rateLimitResponse, PUBLIC_API_LIMIT } from "@/lib/rateLimit";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { blogCreateSchema } from "@/lib/apiSchemas";

// =====================
// 一覧取得 (GET)
// =====================
export async function GET(req: NextRequest) {
  // レート制限チェック
  const rateLimit = await checkRateLimit(req, PUBLIC_API_LIMIT);
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
  const authResult = await requirePermission("blog:write");
  if (!authResult.ok) {
    return authResult.response;
  }

  // 必須・文字数・画像の位置は blogCreateSchema で検証済み
  const parsed = await parseJsonBody(request, blogCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { title, content, imageUrl, imagePosition } = parsed.data;

  try {
    const newBlog = await prisma.blog.create({
      data: {
        title: sanitizeString(title) ?? "",
        content: sanitizeString(content) ?? "",
        imageUrl: sanitizeImageUrl(imageUrl ?? undefined),
        imagePosition,
      },
    });
    return NextResponse.json(newBlog);
  } catch (error) {
    logger.error("作成エラー:", error);
    return apiError("作成に失敗しました", 500);
  }
}
