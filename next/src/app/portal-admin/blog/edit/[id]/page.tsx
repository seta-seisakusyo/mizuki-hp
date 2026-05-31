"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { BlogItem } from "@/types/models";

type ApiErrorResponse = {
    error?: string;
};

type UploadResponse = {
    url?: string;
};

async function readApiError(response: Response, fallback: string) {
    try {
        const data = (await response.json()) as ApiErrorResponse;
        return data.error || fallback;
    } catch {
        return fallback;
    }
}

export default function EditBlogPage() {
    const { id } = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<BlogItem | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imagePosition, setImagePosition] = useState("center");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            const res = await fetch(`/api/blog/${id}`);
            const data = await res.json();
            setBlog(data);
            setTitle(data.title);
            setContent(data.content);
            setImageUrl(data.imageUrl || null);
            setImagePosition(data.imagePosition || "center");
        };
        fetchBlog();
    }, [id]);

    // 🖼️ 画像アップロード処理
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                alert(await readApiError(res, "画像アップロードに失敗しました"));
                return;
            }

            const data = (await res.json()) as UploadResponse;
            if (data.url) {
                setImageUrl(data.url);
            } else {
                alert("アップロード結果のURLが取得できませんでした");
            }
        } catch {
            alert("画像アップロード中にエラーが発生しました");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`/api/blog/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, imageUrl, imagePosition }),
        });
        if (res.ok) router.push("/portal-admin/blog");
        else alert(await readApiError(res, "更新に失敗しました"));
    };

    return (
        <main className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">✏️ 俳句編集</h1>

            {blog ? (
                <form onSubmit={handleUpdate} className="space-y-5 bg-white p-6 rounded-2xl shadow-md">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border p-3 rounded-md"
                    />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full border p-3 rounded-md min-h-[150px]"
                    />

                    {/* 🖼️ 画像アップロード */}
                    <div>
                        <label className="font-semibold block mb-2">📸 サムネイル画像</label>
                        {imageUrl && (
                            <div>
                                <div className="relative w-full h-48 rounded-md border overflow-hidden mb-3">
                                    <img
                                        src={imageUrl}
                                        alt="現在の画像"
                                        className="w-full h-full object-cover"
                                        style={{ objectPosition: imagePosition }}
                                    />
                                </div>
                                <label className="block text-gray-700 mb-1 text-sm font-semibold">
                                    表示位置
                                </label>
                                <select
                                    value={imagePosition}
                                    onChange={(e) => setImagePosition(e.target.value)}
                                    className="border p-2 rounded-md mb-3"
                                >
                                    <option value="top">上</option>
                                    <option value="center">中央</option>
                                    <option value="bottom">下</option>
                                    <option value="left">左</option>
                                    <option value="right">右</option>
                                </select>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                        {uploading && <p className="text-sm text-gray-500 mt-1">アップロード中...</p>}
                    </div>

                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
                    >
                        更新する
                    </button>
                </form>
            ) : (
                <p>読み込み中...</p>
            )}
        </main>
    );
}
