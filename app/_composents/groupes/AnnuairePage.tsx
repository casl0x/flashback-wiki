import { prisma } from "@/lib/db";
import { anton } from "@/lib/fonts";
import { GROUPE_TYPE_META, groupeHref, type GroupeType } from "@/lib/groupe-types";
import { cn } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import AnnuaireExplorer from "./AnnuaireExplorer";

const loadAnnuaire = unstable_cache(
  async (type: GroupeType) => {
    const [categories, groupes] = await Promise.all([
      prisma.groupeCategorie.findMany({
        where: { type },
        orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      }),
      prisma.groupe.findMany({
        where: { type },
        orderBy: { nom: "asc" },
        include: { members: { select: { characterId: true } } },
      }),
    ]);
    return { categories, groupes };
  },
  ["annuaire-page"],
  { revalidate: 300, tags: ["wiki-data"] },
);

/** Annuaire d'une section (entreprises ou services publics), classé par catégorie. */
export default async function AnnuairePage({
  type,
  intro,
}: {
  type: Exclude<GroupeType, "GROUPE">;
  intro: string;
}) {
  const { categories, groupes } = await loadAnnuaire(type);
  const meta = GROUPE_TYPE_META[type];

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <main className="mx-auto flex max-w-295 flex-col gap-7 px-4 pb-16 pt-8 sm:px-5 sm:pt-12">
        <header className="flex flex-col gap-2">
          <h1
            className={cn(
              anton.className,
              "m-0 text-[clamp(44px,8vw,88px)] font-normal uppercase leading-[0.95]",
            )}
          >
            {meta.plural}
          </h1>
          <p className="m-0 max-w-2xl text-[16px] text-[#C4C7CF]">{intro}</p>
        </header>
        <AnnuaireExplorer
          categories={categories.map((c) => ({ id: c.id, nom: c.nom }))}
          items={groupes.map((g) => ({
            id: g.id,
            href: groupeHref(g),
            nom: g.nom,
            color: g.color,
            imageUrl: g.imageUrl,
            members: new Set(g.members.map((m) => m.characterId)).size,
            categorieId: g.categorieId,
          }))}
          emptyLabel={`Aucun résultat dans les ${meta.plural.toLowerCase()}.`}
        />
      </main>
    </div>
  );
}
