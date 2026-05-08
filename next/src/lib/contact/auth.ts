import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function isAdminUser(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  return Boolean(user && user.role === "ADMIN");
}
