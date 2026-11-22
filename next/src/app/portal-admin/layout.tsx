import { can } from "@/lib/permissions";
import { getSessionUser, needsMfaSetup } from "@/lib/staff";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { StaffRoleProvider } from "./StaffRoleProvider";

const SECURITY_PATH = "/portal-admin/security";

export default async function PortalAdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/portal-login");

  if (!can(user.role, "admin:access")) {
    redirect("/?error=unauthorized");
  }

  // x-pathname is set by the middleware, which overwrites any client value.
  const pathname = (await headers()).get("x-pathname");
  if (needsMfaSetup(user) && pathname !== SECURITY_PATH) {
    redirect(SECURITY_PATH);
  }

  return <StaffRoleProvider role={user.role}>{children}</StaffRoleProvider>;
}
