"use client";

import CharacterDetail from "@/components/wiki/CharacterDetail";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import IntroBlock from "@/components/wiki/IntroBlock";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { Character, Player, Version } from "@/lib/db";
import { useAdmin } from "@/lib/useAdmin";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function WikiContent({
  chars,
  versions,
  selVer,
  query,
}: {
  chars: Character[];
  versions: Version[];
  selVer: string;
  query: string;
}) {
  const searchParams = useSearchParams();
  const { isAdmin } = useAdmin();
  const [selChar, setSelChar] = useState<Character | null>(null);

  const filtered = chars.filter((c) => {
    const mv = selVer === "all" || c.version_id === selVer;
    const q = query.toLowerCase();
    const player = c.player as Partial<Player> | null | undefined;
    const ms =
      !q ||
      c.name.toLowerCase().includes(q) ||
      player?.pseudo?.toLowerCase().includes(q) ||
      c.job.toLowerCase().includes(q) ||
      (c.tags || []).some((t: string) => t.toLowerCase().includes(q));
    return mv && ms;
  });

  const activeChar =
    selChar && filtered.some((c) => c.id === selChar.id) ? selChar : null;

  if (activeChar) {
    return (
      <CharacterDetail
        character={activeChar}
        allCharacters={chars}
        onBack={() => setSelChar(null)}
        onNavigate={setSelChar}
      />
    );
  }

  const upl = [
    ...new Set(
      filtered.map((c) => (c.player as Partial<Player> | null | undefined)?.id),
    ),
  ].length;
  const verLabel =
    selVer === "all"
      ? "Tous les personnages"
      : versions.find((v) => v.id === selVer)?.label || selVer;

  return (
    <div className="flex-1 p-5">
      <HeaderBlock
        verLabel={verLabel}
        filteredCount={filtered.length}
        upl={upl}
        isAdmin={isAdmin}
        adminHref={`/admin?token=${searchParams.get("token") || ""}`}
      />

      <IntroBlock />

      <div className="flex items-center gap-2 my-4">
        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <CharactersGrid chars={filtered} onSelect={(c) => setSelChar(c)} />
      )}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<{
    versions: Version[];
    players: Player[];
    characters: Character[];
  }>({
    versions: [],
    players: [],
    characters: [],
  });
  const [selVer, setSelVer] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const r = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" });
    const d = await r.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => {
    const init = () => {
      void loadData();
    };

    queueMicrotask(init);
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const counts: Record<string, number> = {};
  data.characters.forEach((c) => {
    counts[c.version_id] = (counts[c.version_id] || 0) + 1;
  });
  const totalRels = data.characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
    0,
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar
        totalChars={data.characters.length}
        totalPlayers={data.players.length}
        totalVersions={data.versions.length}
        query={query}
        onQueryChange={setQuery}
      />
      <div className="flex flex-1">
        <Sidebar
          versions={data.versions}
          selected={selVer}
          counts={counts}
          totalChars={data.characters.length}
          totalPlayers={data.players.length}
          totalRels={totalRels}
          onSelect={setSelVer}
        />
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-text-faint text-sm">
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
              versions={data.versions}
              selVer={selVer}
              query={query}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
