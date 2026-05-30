"use client";

import NavBar from "@/components/NavBar";
import { ArrowRight, Layers3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Version = {
  id: string;
  label: string;
  description?: string | null;
  color?: string | null;
};

type Character = {
  relations?: unknown[];
};

type Player = Record<string, unknown>;

type Props = {
  versions: Version[];
  counts: Record<string, number>;
  characters: Character[];
  players: Player[];
};

export default function VersionsClient({
  versions,
  counts,
  characters,
  players,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredVersions = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return versions;

    return versions.filter((version) =>
      [version.id, version.label, version.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, versions]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-text-primary">
      <NavBar
        totalChars={characters.length}
        totalPlayers={players.length}
        totalVersions={versions.length}
        query={query}
        onQueryChange={setQuery}
      />
      <div className="flex flex-1">
        <section className="flex-1 p-5">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">
                Flashback WL
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-wide">
                Versions
              </h1>
            </div>

            <div className="mb-4 text-sm text-text-secondary">
              {filteredVersions.length} version
              {filteredVersions.length > 1 ? "s" : ""} trouvée
              {filteredVersions.length > 1 ? "s" : ""}
              {query.trim() ? ` pour “${query.trim()}”` : ""}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredVersions.map((version) => {
                const count = counts[version.id] || 0;

                return (
                  <Link
                    key={version.id}
                    href={`/versions/${version.id}`}
                    className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border-accent hover:shadow-lg hover:shadow-black/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">
                          Version
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold tracking-wide">
                          {version.label}
                        </h2>
                      </div>
                      <div
                        className="rounded-full border px-3 py-1 text-sm"
                        style={{
                          color: version.color ?? "var(--accent)",
                          borderColor: `${version.color ?? "var(--accent)"}40`,
                          background: `${version.color ?? "var(--accent)"}18`,
                        }}
                      >
                        {version.id}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-sm text-text-secondary">
                      <Layers3 className="h-4 w-4 text-accent-light" />
                      {count} personnage{count > 1 ? "s" : ""} lié
                      {count > 1 ? "s" : ""}
                    </div>

                    {version.description && (
                      <p className="mt-4 text-sm leading-7 text-text-secondary">
                        {version.description}
                      </p>
                    )}

                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-accent-light">
                      Ouvrir la page de version
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}