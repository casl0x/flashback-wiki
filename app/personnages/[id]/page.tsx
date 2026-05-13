import CharacterDetailShell from "@/components/wiki/CharacterDetailShell";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { getWikiData } from "@/lib/wiki-data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const { characters, versions, counts, players } = await getWikiData();

  const character = characters.find((entry) => entry.id === id);

  if (!character) {
    notFound();
  }

  const totalRels = characters.reduce(
    (accumulator, entry) => accumulator + (entry.relations?.length || 0),
    0,
  );

  return (
    <main className="flex min-h-screen flex-col bg-background text-text-primary">
      <NavBar
        totalChars={characters.length}
        totalPlayers={players.length}
        totalVersions={versions.length}
      />
      <div className="flex flex-1">
        <Sidebar
          versions={versions}
          counts={counts}
          totalChars={characters.length}
          totalPlayers={players.length}
          totalRels={totalRels}
        />
        <CharacterDetailShell
          character={character}
          allCharacters={characters}
        />
      </div>
    </main>
  );
}
