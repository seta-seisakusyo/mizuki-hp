import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "診療案内",
  description:
    "みずきクリニックの診療案内。診療時間、診療科目、受診の流れについてご案内します。",
};

export default function ConsultationPage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
