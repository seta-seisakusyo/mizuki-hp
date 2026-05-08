import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "医師紹介",
  description:
    "みずきクリニックの医師をご紹介します。経歴、専門分野、資格などの情報をご覧いただけます。",
};

export default function DoctorPage() {
  return (
    <>
      <MainTitle></MainTitle>
      <Details></Details>
    </>
  );
}
