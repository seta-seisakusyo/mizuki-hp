import { timingSafeEqual } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, checkAdminAuth } from "@/lib/apiUtils";
import logger from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_URL_PREFIX = "/uploads/";
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

type BlogBackupImage =
  | {
      path: string;
      mimeType: string;
      encoding: "base64";
      data: string;
    }
  | {
      path: string;
      missing: true;
    }
  | null;

function getSafeUploadPath(imageUrl: string | null): string | null {
  if (!imageUrl?.startsWith(UPLOAD_URL_PREFIX)) {
    return null;
  }

  let relativePath: string;
  try {
    relativePath = decodeURIComponent(imageUrl.slice(UPLOAD_URL_PREFIX.length));
  } catch {
    return null;
  }

  if (!relativePath || relativePath.includes("\0")) {
    return null;
  }

  const uploadRoot = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadRoot, relativePath);

  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

async function readBackupImage(imageUrl: string | null): Promise<BlogBackupImage> {
  const filePath = getSafeUploadPath(imageUrl);
  if (!imageUrl || !filePath) {
    return null;
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return {
      path: imageUrl,
      mimeType: MIME_BY_EXT[ext] ?? "application/octet-stream",
      encoding: "base64",
      data: buffer.toString("base64"),
    };
  } catch (error) {
    logger.warn("俳句バックアップ画像の読み込みに失敗しました", { imageUrl, error });
    return {
      path: imageUrl,
      missing: true,
    };
  }
}

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

    const backupBlogs = await Promise.all(
      blogs.map(async (blog) => ({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl,
        imagePosition: blog.imagePosition,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
        image: await readBackupImage(blog.imageUrl),
      }))
    );

    const backup = {
      schemaVersion: 1,
      source: "mizuki-hp-blog",
      exportedAt: exportedAt.toISOString(),
      blogCount: backupBlogs.length,
      imageCount: backupBlogs.filter((blog) => blog.image && "data" in blog.image).length,
      missingImageCount: backupBlogs.filter((blog) => blog.image && "missing" in blog.image).length,
      blogs: backupBlogs,
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
