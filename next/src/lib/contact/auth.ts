import { auth } from "@/auth";
import { getPrismaClient } from "@/lib/db";

const prisma = getPrismaClient();

export async function isAdminUser(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  return Boolean(user && user.role === "ADMIN");
}
