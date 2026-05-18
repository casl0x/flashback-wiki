import CharacterDetailShell from "@/components/wiki/CharacterDetailShell";
import WikiLayout from "@/components/wiki/WikiLayout";
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
    (acc, entry) => acc + (entry.relations?.length || 0),
    0,
  );

  return (
    <WikiLayout
      totalChars={characters.length}
      totalPlayers={players.length}
      totalVersions={versions.length}
      versions={versions}
      counts={counts}
      totalRels={totalRels}
    >
      <CharacterDetailShell character={character} allCharacters={characters} />
    </WikiLayout>
  );
}
