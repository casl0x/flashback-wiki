import CharactersExplorer from "@/app/_composents/characters/CharactersExplorer";
import { CreateCharacterButton } from "@/app/_composents/user/CreateCharacterButton";
import { cn } from "@/lib/cn";
import { anton } from "@/lib/fonts";
import { prisma } from "@/lib/db";
import { getWikiData } from "@/lib/wiki-data";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = { title: "Personnages et groupes – Flashback Wiki" };

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
      <div className="flex flex-row flex-wrap items-end justify-between gap-4">
        <header>
          <Link
            href="/explorer"
            className="text-[12px] uppercase tracking-[0.3em] text-[#8D93A0] hover:text-white"
          >
            ← Explorer
          </Link>
          <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.5em] text-[#9D93F5] opacity-85">
            Univers
          </p>
          <h1
            className={cn(
              anton.className,
              "m-0 mt-1.5 text-[clamp(56px,10vw,110px)] font-normal uppercase leading-[0.95] text-[#9D93F5]",
            )}
          >
            Personnages
          </h1>
          <p className="mt-3 max-w-140 text-[15px] text-[#8D93A0]">
            {characters.length} fiches · {groupes.length} groupes · toutes
            versions confondues
          </p>
        </header>
        <div className="inline-flex items-center gap-2">
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
