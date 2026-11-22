// @vitest-environment node
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ルートが読み込む認証・DB をモックにする（#192: API の入力検証の集約）
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    news: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    blog: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  },
}));
vi.mock("@/lib/staff", () => ({
  requirePermission: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", email: "admin@example.com", role: "ADMIN", totpEnabledAt: new Date() },
  })),
}));

import { prisma } from "@/lib/db";
import { blogUpdateSchema, newsCreateSchema, newsUpdateSchema, parseNewsDate } from "@/lib/apiSchemas";
import { isRecordNotFound, parseJsonBody } from "@/lib/apiRequest";
import { POST as createNews } from "@/app/api/news/route";
import { DELETE as deleteNews, PUT as updateNews } from "@/app/api/news/[id]/route";
import { POST as createBlog } from "@/app/api/blog/route";
import { PUT as updateBlog } from "@/app/api/blog/[id]/route";

const notFound = () =>
  new Prisma.PrismaClientKnownRequestError("Record to update not found.", {
    code: "P2025",
    clientVersion: "test",
  });

const jsonRequest = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const idParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(prisma.news.create).mockReset();
  vi.mocked(prisma.news.update).mockReset();
  vi.mocked(prisma.news.delete).mockReset();
  vi.mocked(prisma.blog.create).mockReset();
  vi.mocked(prisma.blog.update).mockReset();
  vi.mocked(prisma.blog.findUnique).mockReset();
});

describe("parseNewsDate", () => {
  const now = new Date("2026-11-22T00:00:00+09:00");

  it("ISO 形式と YYYY-MM-DD を受け付ける", () => {
    expect(parseNewsDate("2026-11-02T00:00:00.000Z", now)).toBeInstanceOf(Date);
    expect(parseNewsDate("2026-11-02", now)).toBeInstanceOf(Date);
  });

  it("解釈できない値と範囲外（過去10年より前・未来1年より後）は null", () => {
    expect(parseNewsDate("2026年11月2日", now)).toBeNull();
    expect(parseNewsDate("2015-12-31", now)).toBeNull();
    expect(parseNewsDate("2028-01-01", now)).toBeNull();
  });
});

describe("お知らせのスキーマ", () => {
  const base = { date: "2026-11-02", title: "休診のお知らせ", contents: ["本文"] };

  it("作成時は日付を Date に変換し、色と固定表示に既定値を入れる", () => {
    const result = newsCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.date).toBeInstanceOf(Date);
    expect(result.data.color).toBe("black");
    expect(result.data.pinned).toBe(false);
  });

  it("エラーは日本語で、どの項目かが分かる", () => {
    const result = newsCreateSchema.safeParse({ ...base, title: "", date: "2026年11月2日" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
    expect(messages.title).toBe("タイトルを入力してください。");
    expect(messages.date).toBe("日付が不正です。過去10年〜未来1年の範囲で指定してください。");
  });

  it("更新は部分更新を受け付け、未定義の項目と空の更新は拒否する", () => {
    expect(newsUpdateSchema.safeParse({ pinned: true }).success).toBe(true);
    expect(newsUpdateSchema.safeParse({ pinned: true, extra: 1 }).success).toBe(false);
    expect(newsUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("俳句のスキーマ", () => {
  it("更新は未定義の項目と不正な画像の位置を拒否する", () => {
    expect(blogUpdateSchema.safeParse({ title: "句" }).success).toBe(true);
    expect(blogUpdateSchema.safeParse({ imagePosition: "middle" }).success).toBe(false);
    expect(blogUpdateSchema.safeParse({ title: "句", extra: 1 }).success).toBe(false);
  });
});

describe("parseJsonBody / isRecordNotFound", () => {
  it("JSON として読めない本文は 400", async () => {
    const result = await parseJsonBody(jsonRequest("{not json"), newsCreateSchema);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    expect(await result.response.json()).toEqual({ error: "リクエストの形式が不正です。" });
  });

  it("P2025 だけを「存在しない」と判定する", () => {
    expect(isRecordNotFound(notFound())).toBe(true);
    expect(isRecordNotFound(new Error("other"))).toBe(false);
  });
});

describe("お知らせ API", () => {
  it("POST: 検証エラーは 400 で、最初のエラーを error に、項目ごとの内容を details に入れる", async () => {
    const res = await createNews(
      jsonRequest({ date: "2026-11-02", title: "", contents: ["本文"] }) as never
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "タイトルを入力してください。",
      details: { title: "タイトルを入力してください。" },
    });
    expect(prisma.news.create).not.toHaveBeenCalled();
  });

  it("POST: 正しい入力は日付を Date にして保存する", async () => {
    vi.mocked(prisma.news.create).mockResolvedValue({ id: 1 } as never);
    const res = await createNews(
      jsonRequest({ date: "2026-11-02", title: "休診", contents: ["本文"], color: "red" }) as never
    );
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.news.create).mock.calls[0]![0].data;
    expect(data.date).toBeInstanceOf(Date);
    expect(data).toMatchObject({ title: "休診", color: "red", pinned: false, url: null });
  });

  it("PUT / DELETE: 存在しない ID は 500 ではなく 404", async () => {
    vi.mocked(prisma.news.update).mockRejectedValue(notFound());
    vi.mocked(prisma.news.delete).mockRejectedValue(notFound());

    const put = await updateNews(jsonRequest({ title: "x" }, "PUT"), idParams("999"));
    expect(put.status).toBe(404);
    expect(await put.json()).toEqual({ error: "お知らせが見つかりません" });

    const del = await deleteNews(new Request("http://localhost/api/news/999", { method: "DELETE" }), idParams("999"));
    expect(del.status).toBe(404);
  });

  it("PUT: 送った項目だけを更新する", async () => {
    vi.mocked(prisma.news.update).mockResolvedValue({ id: 1 } as never);
    const res = await updateNews(jsonRequest({ pinned: true }, "PUT"), idParams("1"));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.news.update).mock.calls[0]![0].data;
    expect(data).toEqual({
      title: undefined,
      date: undefined,
      contents: undefined,
      url: undefined,
      color: undefined,
      pinned: true,
    });
  });
});

describe("俳句 API", () => {
  it("POST: 本文が空なら 400（日本語のエラー）", async () => {
    const res = await createBlog(jsonRequest({ title: "句", content: "  " }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("本文を入力してください。");
  });

  it("PUT: 存在しない ID は 404", async () => {
    vi.mocked(prisma.blog.findUnique).mockResolvedValue(null);
    const res = await updateBlog(jsonRequest({ title: "句" }, "PUT"), idParams("999"));
    expect(res.status).toBe(404);
    expect(prisma.blog.update).not.toHaveBeenCalled();
  });
});
