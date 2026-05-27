"use client";

import NavBar from "@/components/NavBar";
import Pagination from "@/components/Pagination";
import Sidebar from "@/components/Sidebar";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import { Character, Player, Version } from "@/lib/db";
import { useState } from "react";

const PER_PAGE = 20;

type Props = {
  versions: Version[];
  players: Player[];
  characters: Character[];
  counts: Record<string, number>;
  totalRels: number;
};

export default function CharactersClient({
  versions,
  players,
  characters,
  counts,
  totalRels,
}: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = characters.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q)
    );
  });

  // Remettre à la page 1 quand la recherche change
  function handleQueryChange(q: string) {
    setQuery(q);
    setPage(1);
  }

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const upl = [...new Set(filtered.map((c) => c.player?.id).filter(Boolean))]
    .length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar
        totalChars={characters.length}
        totalPlayers={players.length}
        totalVersions={versions.length}
        query={query}
        onQueryChange={handleQueryChange}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        menuOpen={menuOpen}
      />
      <div className="flex flex-1">
        <Sidebar
          versions={versions}
          counts={counts}
          totalChars={characters.length}
          totalPlayers={players.length}
          totalRels={totalRels}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
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
            <>
              <CharactersGrid chars={paginated} />
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filtered.length}
                perPage={PER_PAGE}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
