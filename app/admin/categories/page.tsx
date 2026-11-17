import { PageHeader, Panel } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import { GROUPE_STATUTS, GROUPE_STATUT_LABEL } from "@/lib/groupe-types";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await prisma.groupeCategorie.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    include: { _count: { select: { groupes: true } } },
  });
  // Groupes : la « catégorie » est le statut (liste fixe), on affiche seulement l'effectif de chacun.
  const parStatut = await prisma.groupe.groupBy({
    by: ["statut"],
    where: { type: "GROUPE" },
    _count: { _all: true },
  });
  const effectif = new Map(parStatut.map((s) => [s.statut, s._count._all]));
  const rows = (type: "ENTREPRISE" | "SERVICE_PUBLIC") =>
    categories
      .filter((c) => c.type === type)
      .map((c) => ({ key: c.id, id: c.id, nom: c.nom, groupes: c._count.groupes }));

  return (
    <>
      <PageHeader
        title="Catégories"
        meta="Classement des entreprises, des services publics et des groupes"
      />
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
          <Panel
            legend="Groupes"
            aside={
              <span className="text-[12px] text-[#9AA0AA]">Liste fixe</span>
            }
          >
            <div className="flex flex-col gap-2">
              {GROUPE_STATUTS.map((s) => {
                const n = effectif.get(s) ?? 0;
                return (
                  <div
                    key={s}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] px-3 py-2.5 text-[14px]"
                  >
                    <span>{GROUPE_STATUT_LABEL[s]}</span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      {n ? `${n} groupe${n > 1 ? "s" : ""}` : ""}
                    </span>
                  </div>
                );
              })}
              <span className="text-[12px] text-[#9AA0AA]">
                Ces catégories ne se modifient pas ici : on les choisit dans
                l’éditeur de chaque groupe.
              </span>
            </div>
          </Panel>
        </div>
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
