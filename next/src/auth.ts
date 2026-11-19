import { prisma } from "@/lib/db";
import { decryptMfaSecret, deriveMfaKey } from "@/lib/mfa";
import { verifyTotp } from "@/lib/totp";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "../auth.config";

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
const DUMMY_PASSWORD_HASH = "$2b$10$89gj1HTei3jdVvz8.e6sJOh36n9gwxmKJublLj6h.IxuDgzXXPpIe";
const AUTH_ERROR_MESSAGE = "メールアドレスまたはパスワードが正しくありません。";

export const OTP_REQUIRED = "otp_required";
export const OTP_INVALID = "otp_invalid";

/** Password matched; the account has two-factor enabled and no code was sent. */
class OtpRequiredError extends CredentialsSignin {
  code = OTP_REQUIRED;
}

class InvalidOtpError extends CredentialsSignin {
  code = OTP_INVALID;
}

/**
 * Accept a TOTP code once. The step is recorded with a conditional update so
 * a code cannot be replayed, even by two requests racing each other.
 */
async function consumeTotp(
  user: { id: string; totpSecret: string; totpLastStep: number | null },
  code: string
): Promise<boolean> {
  const secret = decryptMfaSecret(deriveMfaKey(), user.totpSecret);
  const step = verifyTotp(secret, code, { lastStep: user.totpLastStep });
  if (step === null) return false;

  const updated = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
    },
    data: { totpLastStep: step },
  });
  return updated.count === 1;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  jwt: { maxAge: 60 * 60 },
  trustHost: true,
  useSecureCookies,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "メールアドレス", type: "text" },
        password: { label: "パスワード", type: "password" },
        code: { label: "確認コード", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        const code = String(credentials?.code || "");
        if (!email || !password) throw new Error(AUTH_ERROR_MESSAGE);

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            totpSecret: true,
            totpEnabledAt: true,
            totpLastStep: true,
          },
        });
        if (!user) {
          await bcryptjs.compare(password, DUMMY_PASSWORD_HASH);
          throw new Error(AUTH_ERROR_MESSAGE);
        }

        const passwordMatch = await bcryptjs.compare(password, String(user.password || ""));
        if (!passwordMatch) throw new Error(AUTH_ERROR_MESSAGE);

        if (user.totpEnabledAt && user.totpSecret) {
          if (!code) throw new OtpRequiredError();
          const ok = await consumeTotp(
            { id: user.id, totpSecret: user.totpSecret, totpLastStep: user.totpLastStep },
            code
          );
          if (!ok) throw new InvalidOtpError();
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
