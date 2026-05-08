import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "クリニック紹介",
  description:
    "みずきクリニックのご紹介。当院の理念、特徴、設備についてご案内します。",
};

export default function DescriptionPage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
