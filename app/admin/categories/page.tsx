import { PageHeader } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await prisma.groupeCategorie.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    include: { _count: { select: { groupes: true } } },
  });
  const rows = (type: "ENTREPRISE" | "SERVICE_PUBLIC") =>
    categories
      .filter((c) => c.type === type)
      .map((c) => ({ key: c.id, id: c.id, nom: c.nom, groupes: c._count.groupes }));

  return (
    <>
      <PageHeader
        title="Catégories"
        meta="Classement des entreprises et des services publics dans leur annuaire"
      />
      <div className="flex flex-wrap items-start gap-5">
        <CategoriesManager
          type="ENTREPRISE"
          title="Entreprises"
          initial={rows("ENTREPRISE")}
        />
        <CategoriesManager
          type="SERVICE_PUBLIC"
          title="Services publics"
          initial={rows("SERVICE_PUBLIC")}
        />
      </div>
    </>
  );
}
