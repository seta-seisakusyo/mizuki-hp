"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import { can, type Permission } from "@/lib/permissions";

const StaffRoleContext = createContext<UserRole | null>(null);

/** 管理画面のレイアウトで、DB から取得したロールを子のページへ渡す */
export function StaffRoleProvider({ role, children }: { role: UserRole; children: ReactNode }) {
  return <StaffRoleContext.Provider value={role}>{children}</StaffRoleContext.Provider>;
}

/** 管理画面のクライアントコンポーネントで、ログイン中のスタッフが権限を持つかを返す */
export function useCan(permission: Permission): boolean {
  return can(useContext(StaffRoleContext), permission);
}
