import { Notice, PageHeader } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import GradeModelesManager from "./GradeModelesManager";

export const dynamic = "force-dynamic";

export default async function AdminGradeModeles() {
  // Si les tables n'existent pas encore (migration non appliquée), on le dit au lieu de planter.
  const modeles = await prisma.gradeModele
    .findMany({
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      include: { grades: { orderBy: { ordre: "asc" } } },
    })
    .catch(() => null);

  return (
    <>
      <PageHeader
        title="Modèles de grades"
        meta="Listes de grades réutilisables, à appliquer depuis l’éditeur de groupe"
      />
      {modeles === null ? (
        <Notice tone="error">
          Les tables des modèles de grades n’existent pas encore dans la base :
          exécute d’abord le SQL de la migration « grade_modeles ».
        </Notice>
      ) : (
        <GradeModelesManager
          initial={modeles.map((m) => ({
            key: m.id,
            id: m.id,
            nom: m.nom,
            type: m.type ?? "",
            grades: m.grades.map((g) => ({
              key: g.id,
              nom: g.nom,
              color: g.color ?? "",
            })),
          }))}
        />
      )}
    </>
  );
}
