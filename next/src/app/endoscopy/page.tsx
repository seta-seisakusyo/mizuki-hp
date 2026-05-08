import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "内視鏡検査",
  description:
    "みずきクリニックの内視鏡検査。胃カメラ・大腸カメラの検査内容、準備、費用についてご案内します。",
};

export default function EndoscopyPage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
