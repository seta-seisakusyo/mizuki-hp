import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isMfaRequired } from "@/lib/mfa";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

const STAFF_ROLES = ["ADMIN", "EDITOR"] as const;
const SECURITY_PATH = "/portal-admin/security";

export default async function PortalAdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/portal-login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, totpEnabledAt: true },
  });

  if (!user || !STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
    redirect("/?error=unauthorized");
  }

  // x-pathname is set by the middleware, which overwrites any client value.
  const pathname = (await headers()).get("x-pathname");
  if (isMfaRequired(user.role) && !user.totpEnabledAt && pathname !== SECURITY_PATH) {
    redirect(SECURITY_PATH);
  }

  return children;
}
