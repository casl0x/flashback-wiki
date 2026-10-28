import AnnuairePage from "@/app/_composents/groupes/AnnuairePage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Entreprises – Flashback Wiki" };

export default function Page() {
  return (
    <AnnuairePage
      type="ENTREPRISE"
      intro="Toutes les entreprises du serveur, classées par catégorie."
    />
  );
}
