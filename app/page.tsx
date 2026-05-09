"use client";

import CharacterDetail from "@/components/wiki/CharacterDetail";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { Character, Player, Version } from "@/lib/db";
import { BookOpen, Filter, PlayCircle, Search, User } from "lucide-react";
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
  const [selChar, setSelChar] = useState<Character | null>(null);

  const filtered = chars.filter((c) => {
    const mv = selVer === "all" || c.versionId === selVer;
    const q = query.toLowerCase();
    const ms =
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q);
    return mv && ms;
  });

  const activeChar =
    selChar && filtered.some((c) => c.id === selChar.id) ? selChar : null;

  const isExplicationView =
    query.trim().toLowerCase() === "explain" || selVer === "explain";

  if (isExplicationView) {
    return (
      <div className="flex-1 p-5">
        <div className="rounded-xl border border-border bg-card p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Wiki Flashback WL</p>
              <p className="text-sm text-muted-foreground">
                Fiches personnages · Relations · Versions
              </p>
            </div>
          </div>

          {/* Intro */}
          <p className="text-sm text-muted-foreground leading-7 border-l-2 border-border pl-4">
            Bienvenue sur le wiki de tous les personnages de Flashback WL !
            Retrouve les fiches de tous les personnages, leurs relations, et les
            versions dans lesquelles ils apparaissent.
          </p>

          {/* How to use */}
          <div className="border-t border-border pt-5 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Comment explorer
            </p>
            {[
              { icon: Search, label: "Recherche par nom, joueur ou métier" },
              {
                icon: Filter,
                label: "Filtrage par version dans la barre latérale",
              },
              {
                icon: User,
                label:
                  "Ouvre une fiche détaillée en cliquant sur un personnage",
              },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm leading-relaxed pt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Bonus */}
          <div className="bg-muted rounded-lg border border-border p-4 flex items-start gap-3">
            <PlayCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour certains personnages, retrouve aussi les{" "}
              <span className="text-foreground font-medium">
                playlistes de rediffusion
              </span>{" "}
              pour voir ou revoir leurs aventures.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const upl = [...new Set(filtered.map((c) => c.player?.id).filter(Boolean))]
    .length;

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
      />

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
    queueMicrotask(() => void loadData());
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const counts: Record<string, number> = {};
  data.characters.forEach((c) => {
    if (c.versionId) counts[c.versionId] = (counts[c.versionId] || 0) + 1;
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
