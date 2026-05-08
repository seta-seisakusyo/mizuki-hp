import Details from './Details';
import MainTitle from './MainTitle';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ワクチン接種",
  description:
    "みずきクリニックのワクチン接種。インフルエンザワクチン、各種予防接種の情報をご案内します。",
};

export default function VaccinePage() {
  return (
    <>
      <MainTitle />
      <Details />
    </>
  );
}
