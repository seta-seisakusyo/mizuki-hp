import Link from "next/link";
import { can, type Permission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/staff";

const menuItems: { label: string; description: string; path: string; icon: string; permission: Permission }[] = [
  {
    label: "俳句投稿",
    description: "俳句の作成・編集・削除",
    path: "/portal-admin/blog",
    icon: "🖊️",
    permission: "blog:write",
  },
  {
    label: "お問い合わせ一覧",
    description: "お問い合わせの確認・管理",
    path: "/portal-admin/inquiry",
    icon: "📩",
    permission: "inquiry:manage",
  },
  {
    label: "お知らせ管理",
    description: "お知らせの作成・編集・削除",
    path: "/portal-admin/news",
    icon: "📢",
    permission: "news:write",
  },
  {
    label: "二要素認証",
    description: "ログイン時の確認コードの設定",
    path: "/portal-admin/security",
    icon: "🔐",
    permission: "admin:access",
  },
];

export default async function AdminDashboard() {
  // ロールは管理画面のレイアウトで確認済み。権限の無いメニューは表示しない（#193）
  const user = await getSessionUser();
  const items = menuItems.filter((item) => can(user?.role, item.permission));

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">管理画面</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition flex flex-col items-center text-center gap-2"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-lg font-semibold">{item.label}</span>
            <span className="text-sm text-gray-500">{item.description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
