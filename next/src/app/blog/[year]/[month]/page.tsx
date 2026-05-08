import Image from "next/image";
import Link from "next/link";
import { getJSTYearMonth, formatJSTDate } from "@/lib/date";

async function getBlogs() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/blog`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("ブログ一覧の取得に失敗しました");
  return res.json();
}

export default async function BlogMonthPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string; month: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const year = resolvedParams.year;
  const month = resolvedParams.month;
  const page = Number(resolvedSearch.page) || 1;

  const blogs = await getBlogs();

  // --- 月で絞り込み ---
  const filtered = blogs.filter((blog: any) => {
    const jst = getJSTYearMonth(blog.createdAt);
    return (
      jst.year.toString() === year &&
      String(jst.month).padStart(2, "0") === month
    );
  });

  // --- ページネーション設定 ---
  const perPage = 6;
  const totalPages = Math.ceil(filtered.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentBlogs = filtered.slice(startIndex, startIndex + perPage);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 bg-[#faf8f6] min-h-screen font-['Yuji_Syuku']">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 sm:mb-12 text-center">
        {year}年{month}月の投稿
      </h1>

      {currentBlogs.length === 0 ? (
        <p className="text-gray-500 text-center mt-16 sm:mt-20 text-base sm:text-lg">
          この月の投稿はありません。
        </p>
      ) : (
        <div className="grid gap-6 sm:gap-10 grid-cols-1 sm:grid-cols-2">
          {currentBlogs.map((blog: any) => (
            <div key={blog.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
              {blog.imageUrl && (
                <div className="relative w-full h-[200px] sm:h-[300px] overflow-hidden">
                  <Image
                    src={blog.imageUrl}
                    alt={blog.title}
                    width={800}
                    height={500}
                    className="object-cover w-full h-full transition-transform duration-700 ease-in-out hover:scale-105"
                    unoptimized={blog.imageUrl.startsWith("/uploads/")}
                  />
                </div>
              )}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2">
                  {blog.title}
                </h2>
                <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {blog.content}
                </p>
                <p className="text-right text-gray-400 text-xs sm:text-sm">
                  {formatJSTDate(blog.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 sm:mt-10 gap-1.5 sm:gap-2 px-4 text-gray-700 font-['Yuji_Syuku']">
          {page > 1 && (
            <Link
              href={`/blog/${year}/${month}?page=${page - 1}`}
              className="px-3 py-2 sm:px-4 text-xs sm:text-sm border rounded-md hover:bg-gray-100 transition"
            >
              前へ
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog/${year}/${month}?page=${p}`}
              className={`px-3 py-2 sm:px-4 text-xs sm:text-sm border rounded-md ${p === page ? "bg-green-700 text-white border-green-700" : "hover:bg-gray-100"
                }`}
            >
              {p}
            </Link>
          ))}

          {page < totalPages && (
            <Link
              href={`/blog/${year}/${month}?page=${page + 1}`}
              className="px-3 py-2 sm:px-4 text-xs sm:text-sm border rounded-md hover:bg-gray-100 transition"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
