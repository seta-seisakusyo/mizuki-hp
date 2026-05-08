import { getPrismaClient } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import authConfig from "../auth.config";

const prisma = getPrismaClient();

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  jwt: { maxAge: 60 * 60 },
  trustHost: true,
  useSecureCookies,
  ...authConfig,
});
