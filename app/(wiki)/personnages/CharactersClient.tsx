"use client";

import Pagination from "@/components/Pagination";
import { SuggestButton } from "@/components/user/SuggestEditButton";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import { useSearch } from "@/components/wiki/SearchContext";
import { Character } from "@/lib/db";
import { useRef, useState } from "react";

const PER_PAGE = 20;

type Props = {
  characters: Character[];
};

export default function CharactersClient({ characters }: Props) {
  const ctx = useSearch();
  const query = ctx?.query ?? "";
  const [page, setPage] = useState(1);
  const prevQueryRef = useRef(query);

  // Filtres locaux
  const [roleFilter, setRoleFilter] = useState<"all" | "civil" | "illegal">(
    "all",
  );
  const [versionFilter, setVersionFilter] = useState<string>("all");

  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    setPage(1);
  }

  // Versions disponibles (dédupliquées)
  const versions = [
    ...new Map(
      characters
        .filter((c) => c.version)
        .map((c) => [c.version!.id, c.version!]),
    ).values(),
  ];

  const filtered = characters.filter((c) => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q);

    const matchRole = roleFilter === "all" || c.role === roleFilter;

    const matchVersion =
      versionFilter === "all" || c.versionId === versionFilter;

    return matchSearch && matchRole && matchVersion;
  });

  // Reset page si filtre change
  const handleRoleFilter = (val: typeof roleFilter) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleVersionFilter = (val: string) => {
    setVersionFilter(val);
    setPage(1);
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const upl = [...new Set(filtered.map((c) => c.player?.id).filter(Boolean))]
    .length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <div className="flex-1 p-4 lg:p-5">
          <HeaderBlock
            verLabel="Tous les personnages"
            filteredCount={filtered.length}
            upl={upl}
          />

          {/* ── Filtres ── */}
          <div className="my-4 flex flex-wrap items-center gap-2">
            {/* Civil / Illégal */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {(["all", "civil", "illegal"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => handleRoleFilter(val)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    roleFilter === val
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-muted hover:text-text-primary"
                  }`}
                >
                  {val === "all"
                    ? "Tous"
                    : val === "civil"
                      ? "Civil"
                      : "Illégal"}
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="h-5 w-px bg-border" />

            {/* Versions */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => handleVersionFilter("all")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  versionFilter === "all"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:bg-muted hover:text-text-primary"
                }`}
              >
                Toutes
              </button>
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVersionFilter(v.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    versionFilter === v.id
                      ? "text-white"
                      : "text-text-secondary hover:bg-muted hover:text-text-primary"
                  }`}
                  style={
                    versionFilter === v.id && v.color
                      ? { backgroundColor: v.color }
                      : {}
                  }
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="items-end flex flex-1 justify-end">
              <SuggestButton mode="create" />
            </div>
          </div>

          {/* Description de la version filtrée — en dehors du flex des filtres */}
          {versionFilter !== "all" &&
            (() => {
              const activeVersion = versions.find(
                (v) => v.id === versionFilter,
              );
              if (!activeVersion?.description) return null;
              return (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-text-secondary">
                  <div
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: activeVersion.color ?? "var(--accent)",
                    }}
                  />
                  <div>
                    <span className="font-medium text-text-primary">
                      {activeVersion.label}
                    </span>
                    <span className="mx-1.5 text-text-faint">·</span>
                    {activeVersion.description}
                  </div>
                </div>
              );
            })()}

          {/* Séparateur décoratif */}
          <div className="mb-4 flex items-center gap-2">
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
