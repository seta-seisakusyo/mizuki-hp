import NewsPageMainTitle from './NewsPageMainTitle';
import NewsPageDetails from './NewsPageDetails';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お知らせ",
  description:
    "みずきクリニックからのお知らせ。診療時間の変更、休診日、イベント情報などをお伝えします。",
};

export default function NewsPage() {
  return (
    <>
      <NewsPageMainTitle></NewsPageMainTitle>
      <NewsPageDetails></NewsPageDetails>
    </>
  );
}
