import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アクセス",
  description:
    "みずきクリニックへのアクセス方法。住所、電話番号、駐車場、公共交通機関でのお越し方をご案内します。",
};

export default function AccessPage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
