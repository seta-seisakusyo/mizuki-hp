"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatJSTDate } from "@/lib/date";

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 投稿一覧を取得
  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blog");
      if (!res.ok) throw new Error("投稿の取得に失敗しました");
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error("取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // 投稿削除
  const handleDelete = async (id: string) => {
    if (!confirm("この投稿を削除しますか？")) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "削除に失敗しました");
        return;
      }
      alert("削除しました");
      fetchBlogs();
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除中にエラーが発生しました");
    }
  };

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* ✅ 新規作成ボタン */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">🖊️ 俳句一覧</h1>
        <Link
          href="/portal-admin/blog/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          ＋ 新規俳句
        </Link>
      </div>

      {/* 投稿リスト */}
      {blogs.length === 0 ? (
        <p className="text-gray-600 text-center mt-10">俳句がありません。</p>
      ) : (
        blogs.map((blog) => (
          <div key={blog.id} className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 items-start">
            {blog.imageUrl && (
              <Image
                src={blog.imageUrl}
                alt={blog.title}
                width={120}
                height={100}
                className="rounded-md object-cover"
                unoptimized={blog.imageUrl.startsWith("/uploads/")}
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{blog.title}</h2>
              <p className="text-gray-600 text-sm truncate">{blog.content}</p>

              <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
                <span>📅 {formatJSTDate(blog.createdAt)}</span>
                <div className="flex gap-4">
                  <Link
                    href={`/portal-admin/blog/edit/${blog.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    ✏️ 編集
                  </Link>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="text-red-600 hover:underline"
                  >
                    🗑 削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
