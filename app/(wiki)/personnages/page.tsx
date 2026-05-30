import { getWikiData } from "@/lib/wiki-data";
import CharactersClient from "./CharactersClient";

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const { versions, players, characters, counts } = await getWikiData();

  const totalRels = characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
    0,
  );

  return (
    <CharactersClient
      versions={versions}
      players={players}
      characters={characters}
      counts={counts}
      totalRels={totalRels}
    />
  );
}
