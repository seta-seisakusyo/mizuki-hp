import InfoDetails from './InfoDetails';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "在宅医療",
  description:
    "みずきクリニックの在宅医療サービス。通院が困難な方への訪問診療についてご案内します。",
};

export default function HomeMedicalCarePage() {
  return (
    <>
      <MainTitle />
      <InfoDetails />
    </>
  );
}
