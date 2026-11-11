import CharactersExplorer from "@/app/_composents/characters/CharactersExplorer";
import { CreateCharacterButton } from "@/app/_composents/user/CreateCharacterButton";
import { cn } from "@/lib/cn";
import { anton } from "@/lib/fonts";
import { prisma } from "@/lib/db";
import { getWikiData } from "@/lib/wiki-data";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = { title: "Explorer – Flashback Wiki" };

export default async function CharactersPage() {
  const { characters, groupes, versions } = await getWikiData();
  // Catégories des entreprises / services publics (sous-filtres de la vue Groupes).
  const categories = await prisma.groupeCategorie
    .findMany({
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      select: { id: true, nom: true, type: true },
    })
    .catch(() => []);

  return (
    <main className="max-w-6xl mx-auto flex flex-col px-4 py-8 lg:gap-12 lg:px-5 lg:py-12">
      <div className="flex flex-row flex-wrap justify-between gap-2 py-4">
        <div>
          <h1
            className={cn(
              anton.className,
              "m-0 text-[clamp(48px,10vw,80px)] uppercase leading-[0.95] text-[#ECECEE]",
            )}
          >
            Explorer
          </h1>
          <p>
            {characters.length} fiches · {groupes.length} groupes · toutes
            versions confondues
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-end">
          <CreateCharacterButton />
        </div>
      </div>
      <CharactersExplorer
        characters={characters}
        groupes={groupes}
        categories={categories}
        versions={versions}
      />
    </main>
  );
}
