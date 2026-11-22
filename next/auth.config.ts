import type { UserRole } from "@prisma/client";
import { NextAuthConfig } from "next-auth";

/** セッション（JWT）の有効期限（秒）。src/auth.ts の jwt.maxAge も同じ値を使う */
export const SESSION_MAX_AGE = 60 * 60;

const authConfig = {
  trustHost: true,

  pages: {
    signIn: "/portal-login",
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },

  // Middleware also consumes this config, so providers and Prisma access are
  // added in src/auth.ts instead of being bundled into the middleware.
  providers: [],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
