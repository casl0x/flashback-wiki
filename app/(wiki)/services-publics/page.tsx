import AnnuairePage from "@/app/_composents/groupes/AnnuairePage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Services publics – Flashback Wiki" };

export default function Page() {
  return (
    <AnnuairePage
      type="SERVICE_PUBLIC"
      intro="Police, secours et autres services publics du serveur, classés par catégorie."
    />
  );
}
