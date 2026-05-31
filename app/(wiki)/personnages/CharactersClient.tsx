"use client";

import Pagination from "@/components/Pagination";
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

  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    setPage(1);
  }

  const filtered = characters.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q)
    );
  });

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
