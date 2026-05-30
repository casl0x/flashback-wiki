import VersionsClient from "./VersionsClient";
import { getWikiData } from "@/lib/wiki-data";

export default async function VersionsPage() {
  const { versions, counts, characters, players } = await getWikiData();

  return (
    <VersionsClient
      versions={versions}
      counts={counts}
      characters={characters}
      players={players}
    />
  );
}
