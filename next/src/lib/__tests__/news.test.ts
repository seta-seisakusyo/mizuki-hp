// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { news: { count: vi.fn(), findMany: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { formatJSTDateLong, toJSTDateInputValue } from "@/lib/date";
import { getNewsPage, parsePage, toNewsItem } from "@/lib/news";
import { newsContentsToLines } from "@/lib/newsContents";

const row = (id: number) => ({
  id,
  date: new Date("2026-06-01T00:00:00.000Z"),
  title: `お知らせ${id}`,
  contents: ["1行目", "", "3行目"],
  url: null,
  color: "black",
  pinned: false,
});

beforeEach(() => {
  vi.mocked(prisma.news.count).mockReset();
  vi.mocked(prisma.news.findMany).mockReset();
});

describe("newsContentsToLines", () => {
  it("文字列の配列・{ value } 形式・文字列単体に対応する", () => {
    expect(newsContentsToLines(["a", "", "b"])).toEqual(["a", "", "b"]);
    expect(newsContentsToLines([{ value: "a" }, "b", 1])).toEqual(["a", "b", ""]);
    expect(newsContentsToLines("a\nb")).toEqual(["a", "b"]);
    expect(newsContentsToLines(null)).toEqual([]);
  });
});

describe("日本時間の日付 (#194)", () => {
  it("UTC の前日 15 時（日本時間 0 時）は、日本時間の日付で扱う", () => {
    const jstMidnight = "2026-11-01T15:00:00.000Z"; // 2026-11-02 00:00 JST
    expect(toJSTDateInputValue(jstMidnight)).toBe("2026-11-02");
    expect(formatJSTDateLong(jstMidnight)).toBe("2026年11月2日");
  });

  it("UTC 0 時（管理画面の YYYY-MM-DD で保存した値）も同じ日付になる", () => {
    expect(toJSTDateInputValue("2026-11-02T00:00:00.000Z")).toBe("2026-11-02");
    expect(formatJSTDateLong("2026-11-02T00:00:00.000Z")).toBe("2026年11月2日");
  });
});

describe("parsePage", () => {
  it("1 以上の整数以外は 1", () => {
    expect(parsePage("3")).toBe(3);
    for (const value of [undefined, "", "0", "-1", "1.5", "abc"]) {
      expect(parsePage(value)).toBe(1);
    }
  });
});

describe("getNewsPage", () => {
  it("固定表示 → 日付の新しい順で、指定ページの分だけ取得する", async () => {
    vi.mocked(prisma.news.count).mockResolvedValue(12);
    vi.mocked(prisma.news.findMany).mockResolvedValue([row(6)] as never);

    const result = await getNewsPage(2, 5);

    expect(result).toMatchObject({ page: 2, totalPages: 3 });
    expect(prisma.news.findMany).toHaveBeenCalledWith({
      orderBy: [{ pinned: "desc" }, { date: "desc" }],
      skip: 5,
      take: 5,
    });
    expect(result.items[0]).toEqual(toNewsItem(row(6)));
    expect(result.items[0]!.lines).toEqual(["1行目", "", "3行目"]);
  });

  it("総ページ数を超えるページは最後のページにする", async () => {
    vi.mocked(prisma.news.count).mockResolvedValue(7);
    vi.mocked(prisma.news.findMany).mockResolvedValue([] as never);

    const result = await getNewsPage(99, 5);

    expect(result.page).toBe(2);
    expect(vi.mocked(prisma.news.findMany).mock.calls[0]![0]).toMatchObject({ skip: 5 });
  });

  it("お知らせが無いときは 1 ページ目・総ページ数 1", async () => {
    vi.mocked(prisma.news.count).mockResolvedValue(0);
    vi.mocked(prisma.news.findMany).mockResolvedValue([] as never);

    expect(await getNewsPage(1, 5)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
