"use client";

import CharactersGrid from "@/app/_composents/characters/CharactersGrid";
import Pagination from "@/app/_composents/ui/Pagination";
import EmptyState from "@/app/_composents/EmptyState";
import { Character } from "@/lib/db";
import { matchesSearch } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import CharacterFilterBar, {
  RoleFilter,
  SortOrder,
} from "./CharacterFilterBar";

const getPerPage = () => {
  if (typeof window === "undefined") return 30;
  if (window.innerWidth < 640) return 12;
  if (window.innerWidth < 1024) return 24;
  return 30;
};

type Props = {
  characters: Character[];
};

export default function CharactersExplorer({ characters }: Props) {
  const [query, setQuery] = useState("");
  const [versionFilter, setVersionFilter] = useState("all");
  const [etatFilter, setEtatFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortOrder>("a→z");
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);

  useEffect(() => {
    const updatePerPage = () => {
      setPerPage(getPerPage());
      setPage(1);
    };

    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const versions = useMemo(
    () =>
      Array.from(
        new Map(
          characters
            .filter((c) => c.version)
            .map((c) => [c.version!.id, c.version!]),
        ).values(),
      )
        .sort((a, b) => a.ordre - b.ordre)
        .map((version) => ({ ...version, ordre: String(version.ordre) })),
    [characters],
  );

  const filtered = useMemo(() => {
    const result = characters.filter((c) => {
      const matchSearch =
        matchesSearch(c.nom, query) ||
        matchesSearch(c.player?.pseudo, query) ||
        c.groupes.some((g) => matchesSearch(g.nom, query));

      return (
        matchSearch &&
        (versionFilter === "all" || c.versionId === versionFilter) &&
        (etatFilter === "all" || c.etatVie === etatFilter) &&
        (roleFilter === "all" || c.role === roleFilter)
      );
    });

    result.sort((a, b) =>
      sort === "a→z" ? a.nom.localeCompare(b.nom) : b.nom.localeCompare(a.nom),
    );

    return result;
  }, [characters, query, versionFilter, etatFilter, roleFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const handlePageChange = (p: number) => setPage(p);

  const resetPage = () => setPage(1);

  return (
    <section className="flex flex-col gap-4">
      <CharacterFilterBar
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          resetPage();
        }}
        versions={versions}
        versionFilter={versionFilter}
        onVersionChange={(v) => {
          setVersionFilter(v);
          resetPage();
        }}
        etatFilter={etatFilter}
        onEtatChange={(v) => {
          setEtatFilter(v);
          resetPage();
        }}
        roleFilter={roleFilter}
        onRoleChange={(v) => {
          setRoleFilter(v);
          resetPage();
        }}
        sort={sort}
        onSortChange={setSort}
        showPanel={showPanel}
        onTogglePanel={() => setShowPanel((v) => !v)}
        resultCount={paginated.length}
      />

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <CharactersGrid chars={paginated} />
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={filtered.length}
            perPage={perPage}
          />
        </>
      )}
    </section>
  );
}
