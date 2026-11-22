import { can } from "@/lib/permissions";
import { getSessionUser } from "@/lib/staff";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * お問い合わせは個人情報のため ADMIN のみ（API も同じ権限で確認している）。
 * 以前は EDITOR にもメニューが表示され、開くと取得に失敗して
 * 「お問い合わせはありません」と表示されていた（#193）。
 */
export default async function InquiryLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!can(user?.role, "inquiry:manage")) redirect("/portal-admin");
  return children;
}
