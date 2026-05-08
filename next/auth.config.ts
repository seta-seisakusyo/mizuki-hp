import { prisma } from "@/lib/db";
import bcryptjs from "bcryptjs";
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// 認証エラーメッセージ（ユーザー列挙を防ぐため統一）
const AUTH_ERROR_MESSAGE = "メールアドレスまたはパスワードが正しくありません。";

const authConfig = {
  pages: {
    signIn: "/portal-login",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "メールアドレス", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "");
        const password = String(credentials?.password || "");

        if (!email || !password) {
          throw new Error("メールアドレス若しくはパスワードが入力されていません。");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          },
        });

        // タイミング攻撃防止: ユーザーが存在しない場合もダミーでbcrypt比較を実行
        if (!user) {
          // ダミーハッシュとの比較で一定時間を消費
          await bcryptjs.compare(password, "$2a$10$dummyhashforuniformtiming");
          throw new Error(AUTH_ERROR_MESSAGE);
        }

        const passwordMatch = await bcryptjs.compare(password, String(user.password || ""));
        if (!passwordMatch) throw new Error(AUTH_ERROR_MESSAGE);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }

      // 後続リクエストで role が未設定の場合は DB から再取得
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true },
        });
        token.role = dbUser?.role || "VIEWER";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
