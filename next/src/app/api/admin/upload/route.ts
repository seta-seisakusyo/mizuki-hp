import { auth } from "@/auth";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";
import { NextResponse } from "next/server";
import path from "path";

// 許可されたMIMEタイプと対応する拡張子
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// マジックバイト（ファイルシグネチャ）
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
};

// 最大ファイルサイズ (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * ファイルのマジックバイトを検証
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[mimeType];
  if (!expectedBytes) return false;

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false;
    }
  }

  // WebPの場合、追加でWEBPシグネチャをチェック
  if (mimeType === "image/webp") {
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
    for (let i = 0; i < webpSignature.length; i++) {
      if (buffer[8 + i] !== webpSignature[i]) {
        return false;
      }
    }
  }

  return true;
}

export async function POST(req: Request) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ADMINロールチェック
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    // MIMEタイプチェック（クライアント報告値）
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "許可されていないファイル形式です（JPEG, PNG, GIF, WebPのみ）" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // マジックバイトによる実際のファイル形式検証
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "ファイルの内容が不正です" },
        { status: 400 }
      );
    }

    // 保存先: public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // ランダムファイル名を生成（MIMEタイプに基づく安全な拡張子を使用）
    const ext = ALLOWED_TYPES[file.type];
    const randomName = crypto.randomUUID();
    const fileName = `${randomName}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: imageUrl });
  } catch {
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
