import { mkdir, readdir, stat, writeFile } from "fs/promises";
import crypto from "crypto";
import { NextResponse } from "next/server";
import path from "path";
import logger from "@/lib/logger";
import { requirePermission } from "@/lib/staff";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest } from "next/server";
import sharp from "sharp";

// 許可されたMIMEタイプと対応する拡張子
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// マジックバイト（ファイルシグネチャ）
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
};

// 最大ファイルサイズ (nginx の client_max_body_size と合わせる)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_STORAGE = 500 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

function normalizeMimeType(mimeType: string): string {
  if (mimeType === "image/jpg" || mimeType === "image/pjpeg") {
    return "image/jpeg";
  }
  return mimeType;
}

function inferMimeTypeFromFileName(fileName: string): string | null {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
}

/**
 * ファイルのマジックバイトを検証
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[mimeType];
  if (!expectedBytes) return false;
  if (buffer.length < expectedBytes.length) return false;

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false;
    }
  }

  // WebPの場合、追加でWEBPシグネチャをチェック
  if (mimeType === "image/webp") {
    if (buffer.length < 12) return false;
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
    for (let i = 0; i < webpSignature.length; i++) {
      if (buffer[8 + i] !== webpSignature[i]) {
        return false;
      }
    }
  }

  return true;
}

async function getUploadStorageBytes(uploadDir: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(uploadDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    total += (await stat(path.join(uploadDir, entry.name))).size;
  }
  return total;
}

export async function POST(req: NextRequest) {
  try {
    const currentAuth = await requirePermission("image:upload");
    if (!currentAuth.ok) return currentAuth.response;

    const rateLimit = await checkRateLimit(req, { max: 10, windowMs: 60 * 1000 });
    if (rateLimit.limited) return rateLimitResponse(rateLimit.resetTime);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは10MB以下にしてください" },
        { status: 400 }
      );
    }

    // MIMEタイプチェック（クライアント報告値が空/不正な場合は拡張子から推定し、実体はマジックバイトで確認）
    const reportedMimeType = normalizeMimeType(file.type);
    const inferredMimeType = inferMimeTypeFromFileName(file.name);
    const mimeType = ALLOWED_TYPES[reportedMimeType] ? reportedMimeType : inferredMimeType;

    if (!mimeType || !ALLOWED_TYPES[mimeType]) {
      return NextResponse.json(
        { error: "許可されていないファイル形式です（JPEG, PNG, WebPのみ）" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // マジックバイトによる実際のファイル形式検証
    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: "ファイルの内容が不正です" },
        { status: 400 }
      );
    }

    // 保存先: public/uploads
    let processedBuffer: Buffer;
    try {
      const pipeline = sharp(buffer, {
        failOn: "error",
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });

      if (mimeType === "image/jpeg") processedBuffer = await pipeline.jpeg({ quality: 88 }).toBuffer();
      else if (mimeType === "image/png") processedBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      else processedBuffer = await pipeline.webp({ quality: 88 }).toBuffer();
    } catch {
      return NextResponse.json({ error: "Invalid or unsupported image data." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const currentStorage = await getUploadStorageBytes(uploadDir);
    if (currentStorage + processedBuffer.length > MAX_UPLOAD_STORAGE) {
      return NextResponse.json({ error: "Upload storage quota exceeded." }, { status: 507 });
    }

    // ランダムファイル名を生成（MIMEタイプに基づく安全な拡張子を使用）
    const ext = ALLOWED_TYPES[mimeType];
    const randomName = crypto.randomUUID();
    const fileName = `${randomName}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, processedBuffer, { flag: "wx" });

    const imageUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    logger.error("アップロードエラー:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
