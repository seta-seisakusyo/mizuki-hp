import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { BlogItem } from "@/types/models";
import { getJSTYearMonth, formatJSTDate } from "@/lib/date";
import { buildPageHref, buildPageItems } from "@/lib/pagination";
import { prisma } from "@/lib/db";
import legacyHaiku from "../../../prisma/legacy-haiku.json";

export const metadata: Metadata = {
    title: "院長俳句展 | みずきクリニック",
    description: "みずきクリニック院長が綴る季節の俳句コレクション。日々の診療の合間に感じた季節の移ろいを、俳句という形で表現しています。",
};

interface HaikuData {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    imageUrl: string | null;
    imagePosition: string;
    isOld?: boolean;
}

// サーバーコンポーネントから直接DBを参照（HTTP呼び出しを回避）
async function getBlogs(): Promise<BlogItem[]> {
    const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: "desc" },
    });
    return blogs.map((blog) => ({
        ...blog,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
    }));
}

// 旧サイト（Wix）の俳句データ（2024/01〜）。
// prisma/migrate-legacy-haiku.mjs で DB と uploads へ移す（#196）。
// 移行が済んだ句は DB 側を表示し、ここからは除く（本番で移行するまでの間も表示が変わらないように）。
// 本番での移行後、このデータと static.wixstatic.com の許可設定を削除する。
type LegacyHaiku = { title: string; content: string; date: string; imageUrl: string };

/** タイトルと投稿日時が同じなら同じ句とみなす（旧データには同名の句がある） */
const haikuKey = (title: string, createdAt: string) =>
    JSON.stringify([title, new Date(createdAt).toISOString()]);

function getOldHaiku(dbBlogs: BlogItem[]): HaikuData[] {
    const migrated = new Set(dbBlogs.map((blog) => haikuKey(blog.title, String(blog.createdAt))));
    // id はタイトルではなく日付+連番で生成する。
    // 旧データには同名の句（例:「冬の虹」が2件）があり、
    // タイトル由来だと React の key が衝突して描画がずれる。
    return (legacyHaiku as LegacyHaiku[])
        .map((item, index) => ({
            id: `old-${item.date}-${index}`,
            title: item.title,
            content: item.content,
            createdAt: new Date(item.date).toISOString(),
            imageUrl: item.imageUrl,
            imagePosition: "center",
            isOld: true,
        }))
        .filter((haiku) => !migrated.has(haikuKey(haiku.title, haiku.createdAt)));
}

export default async function BlogListPage({ searchParams }: { searchParams: Promise<{ page?: string; year?: string; month?: string }> }) {
    const params = await searchParams;
    const dbBlogs = await getBlogs();
    const oldHaiku = getOldHaiku(dbBlogs);

    // DB の俳句と旧サイトの俳句を統合
    const allBlogs: HaikuData[] = [
        ...dbBlogs.map((blog) => ({
            id: String(blog.id),
            title: blog.title,
            content: blog.content,
            createdAt: new Date(blog.createdAt).toISOString(),
            imageUrl: blog.imageUrl,
            imagePosition: blog.imagePosition,
        })),
        ...oldHaiku,
    ];

    // 日付順に並べる
    const blogs = allBlogs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // --- 年月フィルタ ---
    const filterYear = params?.year;
    const filterMonth = params?.month;
    const filteredBlogs = (filterYear && filterMonth)
        ? blogs.filter((blog) => {
            const { year, month } = getJSTYearMonth(blog.createdAt);
            return year === Number(filterYear) && month === Number(filterMonth);
        })
        : blogs;

    // --- ページネーション設定 ---
    const currentPage = Number(params?.page) || 1;
    const perPage = 6;
    const totalPages = Math.ceil(filteredBlogs.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const currentBlogs = filteredBlogs.slice(startIndex, startIndex + perPage);

    // ページ送りのリンクとページ番号の省略表示は @/lib/pagination に切り出している
    // （単体テスト対象。過去にフィルタ引き継ぎ漏れと全件描画の不具合があった）
    const pageHref = (page: number) =>
        buildPageHref(page, { year: filterYear, month: filterMonth });
    const pageItems = buildPageItems(currentPage, totalPages);

    // --- アーカイブグループ ---
    const archiveMap = blogs.reduce<Record<string, number>>((acc, blog) => {
        const { year, month } = getJSTYearMonth(blog.createdAt);
        const monthStr = String(month).padStart(2, "0");
        const key = `${year}年${monthStr}月`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
    const archives = Object.entries(archiveMap) as [string, number][];

    return (
        <main className="min-h-screen font-['Yuji_Syuku']" style={{ background: "linear-gradient(180deg, #f7f3eb 0%, #ede8df 100%)" }}>
            {/* ヘッダー装飾 */}
            <div className="text-center pt-10 pb-6 sm:pt-16 sm:pb-10 px-4">
                <p className="text-xs sm:text-sm text-gray-500 tracking-[0.3em] sm:tracking-[0.5em] mb-2">── 季節のことば ──</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 tracking-[0.2em] sm:tracking-[0.3em]">
                    院長俳句展
                </h1>
                <div className="mt-3 sm:mt-4 flex justify-center items-center gap-3">
                    <span className="block w-10 sm:w-16 h-px bg-gray-400"></span>
                    <span className="text-gray-400 text-base sm:text-lg">✿</span>
                    <span className="block w-10 sm:w-16 h-px bg-gray-400"></span>
                </div>
            </div>

            {/* モバイル: アーカイブを横スクロールで表示 */}
            <div className="lg:hidden max-w-6xl mx-auto px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Link
                        href="/blog"
                        className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition ${!filterYear ? "bg-green-800 text-white border-green-800" : "border-gray-300 text-gray-600 hover:bg-green-50"}`}
                    >
                        すべて ({blogs.length})
                    </Link>
                    {archives.map(([key, count]) => {
                        const match = key.match(/(\d+)年(\d+)月/);
                        if (!match || !match[1] || !match[2]) return null;
                        const year = match[1];
                        const month = match[2];
                        const isActive = filterYear === year && filterMonth === month;
                        return (
                            <Link
                                key={key}
                                href={`/blog?year=${year}&month=${month}`}
                                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition ${isActive ? "bg-green-800 text-white border-green-800" : "border-gray-300 text-gray-600 hover:bg-green-50"}`}
                            >
                                {key} ({count})
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16 grid lg:grid-cols-[1fr_240px] gap-6 lg:gap-10">
                {/* 俳句カード一覧 */}
                <div className="grid gap-4 sm:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                    {currentBlogs.map((blog) => (
                        <article
                            key={blog.id}
                            className="group relative overflow-hidden rounded-sm shadow-md hover:shadow-xl transition-all duration-500"
                            style={{ background: "linear-gradient(180deg, #fffef9 0%, #f5f0e6 100%)" }}
                        >
                            {/* 短冊風の上ライン */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-700 via-green-600 to-green-800"></div>

                            {blog.imageUrl && (
                                <div className="relative w-full aspect-[4/3] overflow-hidden">
                                    <Image
                                        src={blog.imageUrl}
                                        alt={blog.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 33vw"
                                        className="object-cover"
                                        style={{ objectPosition: blog.imagePosition || "center" }}
                                        unoptimized={blog.imageUrl.startsWith("/uploads/")}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            )}

                            {/* 縦書きエリア */}
                            <div className="flex flex-col items-center py-3 px-2 sm:py-6 sm:px-3">
                                <div className="flex gap-2 sm:gap-4 h-[160px] sm:h-[220px]">
                                    {/* 左：本文（縦書き・太字・段下げ） */}
                                    {blog.content && (
                                        <div
                                            className="text-sm sm:text-base text-gray-800 font-bold leading-relaxed"
                                            style={{ writingMode: "vertical-rl" }}
                                        >
                                            {blog.content.split("\n").map((line, i) => (
                                                <p key={`${blog.id}-line-${i}`} style={{ marginTop: i === 1 ? "1.5em" : i === 2 ? "3em" : 0 }}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {/* 右：タイトル（縦書き・通常） */}
                                    <h2
                                        className="text-sm sm:text-lg text-gray-600 font-normal leading-relaxed"
                                        style={{ writingMode: "vertical-rl" }}
                                    >
                                        {blog.title}
                                    </h2>
                                </div>

                                {/* 日付（横書き） */}
                                <time className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-400">
                                    {formatJSTDate(blog.createdAt)}
                                </time>
                            </div>
                        </article>
                    ))}
                </div>

                {/* 右側：アーカイブ（デスクトップのみ） */}
                <aside className="hidden lg:block h-fit sticky top-6">
                    <nav className="rounded-sm p-5 shadow-sm border border-gray-200" style={{ background: "#fffef9" }}>
                        <h2 className="text-center text-sm font-semibold text-gray-600 tracking-[0.3em] mb-4 pb-2 border-b border-gray-200">
                            句 集
                        </h2>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/blog"
                                    className={`flex justify-between items-center transition py-1 px-2 rounded hover:bg-green-50 ${!filterYear ? "text-green-800 font-semibold" : "text-gray-600 hover:text-green-800"}`}
                                >
                                    <span className="tracking-wider">すべて</span>
                                    <span className="text-xs text-gray-400">({blogs.length}句)</span>
                                </Link>
                            </li>
                            {archives.map(([key, count]) => {
                                const match = key.match(/(\d+)年(\d+)月/);
                                if (!match || !match[1] || !match[2]) return null;
                                const year = match[1];
                                const month = match[2];
                                // モバイルのチップと同様に選択中の月を強調する
                                const isActive = filterYear === year && filterMonth === month;
                                return (
                                    <li key={key}>
                                        <Link
                                            href={`/blog?year=${year}&month=${month}`}
                                            aria-current={isActive ? "page" : undefined}
                                            className={`flex justify-between items-center transition py-1 px-2 rounded hover:bg-green-50 ${isActive ? "bg-green-50 text-green-800 font-semibold" : "text-gray-600 hover:text-green-800"}`}
                                        >
                                            <span className="tracking-wider">{key}</span>
                                            <span className={`text-xs ${isActive ? "text-green-700" : "text-gray-400"}`}>({count}句)</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
                <nav className="flex justify-center items-center pb-10 sm:pb-16 gap-1.5 sm:gap-2 px-4 text-gray-700 font-['Yuji_Syuku'] flex-wrap" aria-label="ページネーション">
                    {currentPage > 1 && (
                        <Link
                            href={pageHref(currentPage - 1)}
                            className="px-3 py-2 sm:px-4 text-xs sm:text-sm border border-gray-300 rounded hover:bg-white transition"
                        >
                            前へ
                        </Link>
                    )}

                    {pageItems.map((item, i) =>
                        item === null ? (
                            <span key={`gap-${i}`} className="px-1 text-xs sm:text-sm text-gray-400 select-none">…</span>
                        ) : (
                            <Link
                                key={item}
                                href={pageHref(item)}
                                className={`px-3 py-2 sm:px-4 text-xs sm:text-sm border rounded ${item === currentPage
                                    ? "bg-green-800 text-white border-green-800"
                                    : "border-gray-300 hover:bg-white"
                                    }`}
                                aria-current={item === currentPage ? "page" : undefined}
                            >
                                {item}
                            </Link>
                        )
                    )}

                    {currentPage < totalPages && (
                        <Link
                            href={pageHref(currentPage + 1)}
                            className="px-3 py-2 sm:px-4 text-xs sm:text-sm border border-gray-300 rounded hover:bg-white transition"
                        >
                            次へ
                        </Link>
                    )}
                </nav>
            )}
        </main>
    );
}
