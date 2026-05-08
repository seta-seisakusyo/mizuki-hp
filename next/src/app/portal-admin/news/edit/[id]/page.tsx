"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditNewsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [contents, setContents] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("black");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (!res.ok) throw new Error("取得に失敗しました");
        const data = await res.json();
        setTitle(data.title);
        setDate(new Date(data.date).toISOString().split("T")[0]);
        const contentsText =
          Array.isArray(data.contents)
            ? data.contents.join("\n")
            : String(data.contents || "");
        setContents(contentsText);
        setUrl(data.url || "");
        setColor(data.color || "black");
        setPinned(data.pinned || false);
      } catch (err) {
        console.error(err);
        setError("データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: new Date(date).toISOString(),
          contents: contents.split("\n"),
          url: url || null,
          color,
          pinned,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "更新に失敗しました");
      }

      router.push("/portal-admin/news");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📢 お知らせ編集</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white p-6 rounded-2xl shadow-md"
      >
        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
            {error}
          </p>
        )}

        <div>
          <label className="block text-gray-700 mb-1 font-semibold">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-3 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-semibold">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border p-3 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-semibold">内容</label>
          <textarea
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            className="w-full border p-3 rounded-md min-h-[120px]"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-semibold">リンクURL（任意）</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border p-3 rounded-md"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-semibold">文字色</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="color"
                value="black"
                checked={color === "black"}
                onChange={(e) => setColor(e.target.value)}
              />
              <span>黒</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="color"
                value="red"
                checked={color === "red"}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className="text-red-600">赤</span>
            </label>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 font-semibold">一番上に固定する</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {saving ? "更新中..." : "更新する"}
        </button>
      </form>
    </main>
  );
}
