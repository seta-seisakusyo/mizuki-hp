#!/usr/bin/env node
/**
 * 旧サイト（Wix）の俳句を DB と uploads に移す（#196）
 *
 * 旧サイトの俳句 23 件は、これまで src/app/blog/page.tsx に直書きされ、
 * 画像は static.wixstatic.com から直接読み込んでいた。このスクリプトは
 *   1. 画像を取得し、アップロード API と同じ処理（向きの補正・2400px 以内への縮小・再エンコード）で
 *      uploads に `<uuid>.jpg` として保存する
 *   2. Blog テーブルに登録する（createdAt は旧サイトの日付）
 * を行う。同じタイトル・日付の句が DB にあれば飛ばすので、何度実行しても重複しない。
 *
 * 使い方（本番。next コンテナの中で実行する）:
 *   docker compose -f docker-compose.yml exec next node prisma/migrate-legacy-haiku.mjs --dry-run
 *   docker compose -f docker-compose.yml exec next node prisma/migrate-legacy-haiku.mjs
 *
 * オプション:
 *   --dry-run            DB と uploads を変更せず、移行する句を表示するだけ
 *   --upload-dir <path>  画像の保存先（既定: <cwd>/public/uploads）
 *
 * 必要な環境変数: DATABASE_URL
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const uploadDirIndex = args.indexOf("--upload-dir");
const uploadDir = path.resolve(
  uploadDirIndex >= 0 && args[uploadDirIndex + 1]
    ? args[uploadDirIndex + 1]
    : path.join(process.cwd(), "public", "uploads")
);

// アップロード API（src/app/api/admin/upload/route.ts）と同じ制限
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

/** Wix の変換指定（/v1/fill/...）を外し、元の画像の URL にする */
export function originalWixUrl(url) {
  const match = /^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)\/v1\//.exec(url);
  return match ? match[1] : url;
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`画像ではありません（${type || "content-type なし"}）`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_BYTES) throw new Error(`サイズが大きすぎます（${buffer.length} bytes）`);
  return buffer;
}

async function toJpeg(buffer) {
  return sharp(buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
}

/** 元の画像を優先し、取得できなければ旧サイトで表示していた変換後の画像を使う */
async function fetchImage(item) {
  const candidates = [...new Set([originalWixUrl(item.imageUrl), item.imageUrl])];
  let lastError;
  for (const url of candidates) {
    try {
      return { buffer: await toJpeg(await download(url)), source: url };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function main() {
  const items = JSON.parse(await readFile(new URL("./legacy-haiku.json", import.meta.url), "utf8"));
  const prisma = new PrismaClient();
  const summary = { migrated: 0, skipped: 0, failed: 0 };

  console.log(`${dryRun ? "[dry-run] " : ""}旧サイトの俳句 ${items.length} 件 / 画像の保存先: ${uploadDir}`);
  if (!dryRun) await mkdir(uploadDir, { recursive: true });

  try {
    for (const item of items) {
      // 公開ページ（src/app/blog/page.tsx）と同じく、日付の UTC 0 時を投稿日時にする
      const createdAt = new Date(item.date);
      const label = `${item.date} ${item.title}`;

      const existing = await prisma.blog.findFirst({
        where: { title: item.title, createdAt },
        select: { id: true },
      });
      if (existing) {
        summary.skipped += 1;
        console.log(`  skip     ${label}（移行済み: id=${existing.id}）`);
        continue;
      }
      if (dryRun) {
        summary.migrated += 1;
        console.log(`  migrate  ${label}`);
        continue;
      }

      let filePath;
      try {
        const { buffer, source } = await fetchImage(item);
        const fileName = `${randomUUID()}.jpg`;
        filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer, { flag: "wx" });

        const blog = await prisma.blog.create({
          data: {
            title: item.title,
            content: item.content,
            imageUrl: `/uploads/${fileName}`,
            imagePosition: "center",
            createdAt,
          },
          select: { id: true },
        });
        summary.migrated += 1;
        console.log(`  migrate  ${label} → id=${blog.id}, /uploads/${fileName}（${Math.round(buffer.length / 1024)}KB, ${source === item.imageUrl ? "表示用の画像" : "元の画像"}）`);
      } catch (error) {
        summary.failed += 1;
        if (filePath) await unlink(filePath).catch(() => undefined);
        console.error(`  FAILED   ${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}移行 ${summary.migrated} 件 / 移行済みで飛ばした ${summary.skipped} 件 / 失敗 ${summary.failed} 件`
  );
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
