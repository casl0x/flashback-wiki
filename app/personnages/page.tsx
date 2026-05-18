"use client";

import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { Character, Player, Version } from "@/lib/db";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function WikiContent({
  chars,
  query,
  onOpenCharacter,
}: {
  chars: Character[];
  query: string;
  onOpenCharacter: (id: string) => void;
}) {
  const filtered = chars.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q)
    );
  });

  const upl = [...new Set(filtered.map((c) => c.player?.id).filter(Boolean))]
    .length;

  return (
    <div className="flex-1 p-4 lg:p-5">
      <HeaderBlock
        verLabel="Tous les personnages"
        filteredCount={filtered.length}
        upl={upl}
      />

      <div className="my-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <CharactersGrid
          chars={filtered}
          onSelect={(c) => onOpenCharacter(c.id)}
        />
      )}
    </div>
  );
}

export default function CharactersPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    versions: Version[];
    players: Player[];
    characters: Character[];
  }>({ versions: [], players: [], characters: [] });
  const [selVer, setSelVer] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadData() {
    const response = await fetch(`/api/data?t=${Date.now()}`, {
      cache: "no-store",
    });
    const nextData = await response.json();
    setData(nextData);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => void loadData());
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const counts: Record<string, number> = {};
  data.characters.forEach((character) => {
    if (character.versionId) {
      counts[character.versionId] = (counts[character.versionId] || 0) + 1;
    }
  });

  const totalRels = data.characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
    0,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar
        totalChars={data.characters.length}
        totalPlayers={data.players.length}
        totalVersions={data.versions.length}
        query={query}
        onQueryChange={setQuery}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        menuOpen={menuOpen}
      />
      <div className="flex flex-1">
        <Sidebar
          versions={data.versions}
          counts={counts}
          totalChars={data.characters.length}
          totalPlayers={data.players.length}
          totalRels={totalRels}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-text-faint">
            Chargement...
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex-1 p-10 text-text-faint">Chargement...</div>
            }
          >
            <WikiContent
              chars={data.characters}
              query={query}
              onOpenCharacter={(id) => router.push(`/personnages/${id}`)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
