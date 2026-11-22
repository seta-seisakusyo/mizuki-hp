import { prisma } from "@/lib/db";
import { newsContentsToLines } from "@/lib/newsContents";
import type { NewsItem } from "@/types/models";

type NewsRow = {
  id: number;
  date: Date;
  title: string;
  contents: unknown;
  url: string | null;
  color: string;
  pinned: boolean;
};

export function toNewsItem(row: NewsRow): NewsItem {
  return {
    id: row.id,
    date: row.date.toISOString(),
    title: row.title,
    lines: newsContentsToLines(row.contents),
    url: row.url,
    color: row.color,
    pinned: row.pinned,
  };
}

/** 1 以上の整数のページ番号にする（不正な値は 1） */
export function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/**
 * 公開ページ用にお知らせを取得する（固定表示 → 日付の新しい順）。
 * page が総ページ数を超える場合は最後のページを返す。
 */
export async function getNewsPage(
  page: number,
  perPage: number
): Promise<{ items: NewsItem[]; page: number; totalPages: number }> {
  const total = await prisma.news.count();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);

  const rows = await prisma.news.findMany({
    orderBy: [{ pinned: "desc" }, { date: "desc" }],
    skip: (current - 1) * perPage,
    take: perPage,
  });

  return { items: rows.map(toNewsItem), page: current, totalPages };
}
