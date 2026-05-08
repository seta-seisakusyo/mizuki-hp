import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 管理画面へのアクセスを許可するロール
const ADMIN_ROLES = ["ADMIN", "EDITOR"] as const;

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isProtectedRoute = nextUrl.pathname.startsWith("/portal-admin");
  const isLoginPage = nextUrl.pathname.startsWith("/portal-login");

  // 未ログインで保護ルートにアクセスした場合 → ログインページへ
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/portal-login", nextUrl));
  }

  // ログイン済みだがADMIN/EDITORロールでない場合 → アクセス拒否
  if (isProtectedRoute && isLoggedIn && !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
    return NextResponse.redirect(new URL("/?error=unauthorized", nextUrl));
  }

  // ログイン済みでログインページにアクセスした場合 → 管理画面へ
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/portal-admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/portal-admin/:path*", "/portal-login"],
};
