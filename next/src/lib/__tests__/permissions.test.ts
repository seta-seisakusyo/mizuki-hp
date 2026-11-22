import { describe, expect, it } from "vitest";
import { can, isMfaRequired, isStaffRole, PERMISSIONS } from "@/lib/permissions";

describe("権限の対応表 (#193)", () => {
  it("ADMIN はすべての操作ができる", () => {
    for (const permission of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(can("ADMIN", permission)).toBe(true);
    }
  });

  it("EDITOR は管理画面・お知らせ・俳句の操作ができ、画像のアップロードとお問い合わせはできない", () => {
    expect(can("EDITOR", "admin:access")).toBe(true);
    expect(can("EDITOR", "news:write")).toBe(true);
    expect(can("EDITOR", "blog:write")).toBe(true);
    expect(can("EDITOR", "image:upload")).toBe(false);
    expect(can("EDITOR", "inquiry:manage")).toBe(false);
  });

  it("VIEWER・未ログイン・不正な値は何もできない", () => {
    for (const role of ["VIEWER", undefined, null, "", "admin", 1]) {
      expect(can(role, "admin:access")).toBe(false);
      expect(isStaffRole(role)).toBe(false);
    }
  });

  it("二要素認証が必須なのは ADMIN だけ", () => {
    expect(isMfaRequired("ADMIN")).toBe(true);
    expect(isMfaRequired("EDITOR")).toBe(false);
    expect(isMfaRequired(undefined)).toBe(false);
  });
});
