import CharactersGrid from "@/components/wiki/CharactersGrid";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { getWikiData } from "@/lib/wiki-data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VersionPage({ params }: Props) {
  const { id } = await params;
  const { versions, counts, characters, players } = await getWikiData();
  const version = versions.find((entry) => entry.id === id);

  if (!version) {
    notFound();
  }

  const filtered = characters.filter((character) => character.versionId === id);
  const totalRels = characters.reduce(
    (accumulator, character) =>
      accumulator + (character.relations?.length || 0),
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
        <section className="flex-1 p-5">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">
                Version {version.id}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-wide">
                {version.label}
              </h1>
              {version.description && (
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {version.description}
                </p>
              )}
            </div>

            <CharactersGrid chars={filtered} />
          </div>
        </section>
      </div>
    </main>
  );
}
