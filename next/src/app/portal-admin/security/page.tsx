import { isMfaRequired } from "@/lib/permissions";
import { getSessionUser } from "@/lib/staff";
import { redirect } from "next/navigation";
import TotpSettings from "./TotpSettings";

export default async function SecurityPage() {
  // レイアウトと同じ取得結果を使う（cache により DB の問い合わせは 1 回）
  const user = await getSessionUser();
  if (!user) redirect("/portal-login");

  const required = isMfaRequired(user.role);
  const enabled = Boolean(user.totpEnabledAt);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">二要素認証</h1>

      {required && !enabled && (
        <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          管理者のアカウントは、二要素認証を設定するまで管理画面を使えません。
          スマートフォンの認証アプリ（Google Authenticator、Microsoft Authenticator など）で設定してください。
        </p>
      )}

      <TotpSettings enabled={enabled} canDisable={!required} />
    </main>
  );
}
