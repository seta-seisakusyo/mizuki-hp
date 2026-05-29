import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth } from "@/lib/apiUtils";
import logger from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backupFileName(exportedAt: Date) {
  const timestamp = exportedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return `mizuki-haiku-backup-${timestamp}.json`;
}

function isBackupTokenAuthorized(request: NextRequest) {
  const expectedToken = process.env.HAIKU_BACKUP_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!providedToken) {
    return false;
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

export async function GET(request: NextRequest) {
  if (!isBackupTokenAuthorized(request)) {
    const authResult = await checkAdminAuth();
    if (!authResult.isAdmin) {
      return authResult.response;
    }
  }

  try {
    const exportedAt = new Date();
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "asc" },
    });

    const backup = {
      schemaVersion: 2,
      source: "mizuki-hp-blog",
      exportedAt: exportedAt.toISOString(),
      blogCount: blogs.length,
      imageMode: "metadata-only",
      note: "Uploaded image files are backed up by scripts/backup-haiku.sh as uploads.tar.gz.",
      blogs: blogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl,
        imagePosition: blog.imagePosition,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      })),
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${backupFileName(exportedAt)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("俳句バックアップ作成エラー:", error);
    return apiError("バックアップの作成に失敗しました", 500);
  }
}
