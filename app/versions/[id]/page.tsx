import { getWikiData } from "@/lib/wiki-data";
import { notFound } from "next/navigation";
import VersionClient from "./VersionPage";

export default async function VersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { versions, counts, characters, players } = await getWikiData();
  const version = versions.find((v) => v.id === id);
  if (!version) notFound();

  const totalRels = characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
    0,
  );

  return (
    <VersionClient
      version={{
        ...version,
        description: version.description ?? undefined,
      }}
      versions={versions}
      counts={counts}
      characters={characters}
      players={players}
      totalRels={totalRels}
    />
  );
}
