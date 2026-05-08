import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "オンライン診療",
  description:
    "みずきクリニックのオンライン診療。ご自宅から受診いただけるオンライン診療の流れや対応可能な症状についてご案内します。",
};

export default function OnlinePage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
