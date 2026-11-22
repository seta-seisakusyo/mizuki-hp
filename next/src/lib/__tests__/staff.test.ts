// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: vi.fn() } } }));
// cache() はリクエストの外では効かないため、テストでは素通しにする
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AUTH_MESSAGES, requirePermission } from "@/lib/staff";

const loginAs = (email: string | null) =>
  vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue(
    email ? { user: { email } } : null
  );
const dbUser = (role: string, totpEnabledAt: Date | null = new Date()) =>
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "u1",
    email: "staff@example.com",
    role,
    totpEnabledAt,
  } as never);

beforeEach(() => {
  vi.mocked(prisma.user.findUnique).mockReset();
});

describe("requirePermission (#193)", () => {
  it("未ログインは 401", async () => {
    loginAs(null);
    const result = await requirePermission("news:write");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: AUTH_MESSAGES.unauthenticated });
  });

  it("権限の無いロールは 403（以前のお問い合わせ API は 401 を返していた）", async () => {
    loginAs("editor@example.com");
    dbUser("EDITOR");
    const result = await requirePermission("inquiry:manage");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({ error: AUTH_MESSAGES.forbidden });
  });

  it("二要素認証が未設定の ADMIN も許可された操作はできる", async () => {
    loginAs("admin@example.com");
    dbUser("ADMIN", null);
    const result = await requirePermission("inquiry:manage");
    expect(result.ok).toBe(true);
  });

  it("EDITOR は二要素認証が無くても許可された操作はできる", async () => {
    loginAs("editor@example.com");
    dbUser("EDITOR", null);
    const result = await requirePermission("blog:write");
    expect(result.ok).toBe(true);
  });

  it("ロールはセッションではなく DB の値で判定する", async () => {
    loginAs("former-admin@example.com");
    dbUser("VIEWER");
    expect((await requirePermission("news:write")).ok).toBe(false);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "former-admin@example.com" } })
    );
  });

  it("DB に存在しないユーザーは 401", async () => {
    loginAs("deleted@example.com");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await requirePermission("news:write");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });
});
