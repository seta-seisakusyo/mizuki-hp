import BaseContainer from "@/components/BaseContainer";
import { getNewsPage, parsePage } from "@/lib/news";
import NewsList from "./NewsList";
import NewsPageMainTitle from "./NewsPageMainTitle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お知らせ",
  description:
    "みずきクリニックからのお知らせ。診療時間の変更、休診日、イベント情報などをお伝えします。",
};

// TODO(#121): お知らせ（5件）と俳句（6件）でページサイズが違う
const NEWS_PER_PAGE = 5;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const result = await getNewsPage(parsePage(page), NEWS_PER_PAGE);

  return (
    <>
      <NewsPageMainTitle />
      <BaseContainer>
        <NewsList items={result.items} page={result.page} totalPages={result.totalPages} />
      </BaseContainer>
    </>
  );
}
