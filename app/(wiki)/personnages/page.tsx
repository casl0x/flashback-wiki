import CharactersExplorer from "@/app/_composents/characters/CharactersExplorer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { anton } from "@/lib/fonts";
import { getWikiData } from "@/lib/wiki-data";

export const revalidate = 300;

export default async function CharactersPage() {
  const { characters } = await getWikiData();

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
            Joueurs
          </h1>
          <p>{characters.length} fiches · toutes versions confondues</p>
        </div>
        <div className="inline-flex items-center gap-2 self-end">
          <Button size="sm" variant="outline">
            + Proposer un personnage
          </Button>
        </div>
      </div>
      <CharactersExplorer characters={characters} />
    </main>
  );
}
