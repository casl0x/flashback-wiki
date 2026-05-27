"use client";

import NavBar from "@/components/NavBar";
import Pagination from "@/components/Pagination";
import Sidebar from "@/components/Sidebar";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import type { Character as DbCharacter, Version as DbVersion } from "@/lib/db";
import { useState } from "react";

const PER_PAGE = 20;

type Character = DbCharacter;

type Player = {
  [key: string]: unknown;
};

type Props = {
  version: { id: string; label: string; description?: string };
  versions: DbVersion[];
  counts: Record<string, number>;
  characters: Character[];
  players: Player[];
  totalRels: number;
};

export default function VersionClient({
  version,
  versions,
  counts,
  characters,
  players,
  totalRels,
}: Props) {
  const [page, setPage] = useState(1);

  const filtered = characters.filter((c) => c.versionId === version.id);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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

            <CharactersGrid chars={paginated} />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filtered.length}
              perPage={PER_PAGE}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
