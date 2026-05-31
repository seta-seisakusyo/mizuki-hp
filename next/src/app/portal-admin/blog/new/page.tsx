"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ApiErrorResponse = {
    error?: string;
};

async function readApiError(response: Response, fallback: string) {
    try {
        const data = (await response.json()) as ApiErrorResponse;
        return data.error || fallback;
    } catch {
        return fallback;
    }
}

export default function NewBlogPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imagePosition, setImagePosition] = useState("center");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // 📸 プレビュー表示
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setError("");
        setImageFile(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let imageUrl = null;

            // ✅ 画像が選択されていたらアップロード
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);

                const uploadRes = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error(await readApiError(uploadRes, "画像のアップロードに失敗しました"));
                }

                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url; // ← アップロード先URLを受け取る
            }

            // ✅ 本文データを送信
            const res = await fetch("/api/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, imageUrl, imagePosition }),
            });

            if (!res.ok) {
                throw new Error(await readApiError(res, "投稿に失敗しました"));
            }

            router.push("/portal-admin/blog");
        } catch (err) {
            setError(err instanceof Error ? err.message : "投稿に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">🖊️ 新規俳句投稿</h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-5 bg-white p-6 rounded-2xl shadow-md"
            >
                {error && (
                    <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                        {error}
                    </p>
                )}

                {/* タイトル */}
                <input
                    type="text"
                    placeholder="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border p-3 rounded-md"
                    required
                />

                {/* 本文 */}
                <textarea
                    placeholder="本文"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border p-3 rounded-md min-h-[150px]"
                    required
                />

                {/* 画像アップロード */}
                <div>
                    <label className="block text-gray-700 mb-2 font-semibold">
                        📸 サムネイル画像
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full border p-2 rounded-md"
                    />
                    {previewUrl && (
                        <div className="mt-4">
                            <div className="relative w-full h-60 rounded-lg shadow-md overflow-hidden border">
                                <img
                                    src={previewUrl}
                                    alt="プレビュー"
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: imagePosition }}
                                />
                            </div>
                            <label className="block text-gray-700 mt-3 mb-1 text-sm font-semibold">
                                表示位置
                            </label>
                            <select
                                value={imagePosition}
                                onChange={(e) => setImagePosition(e.target.value)}
                                className="border p-2 rounded-md"
                            >
                                <option value="top">上</option>
                                <option value="center">中央</option>
                                <option value="bottom">下</option>
                                <option value="left">左</option>
                                <option value="right">右</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* 投稿ボタン */}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                    {loading ? "投稿中..." : "投稿する"}
                </button>
            </form>
        </main>
    );
}
