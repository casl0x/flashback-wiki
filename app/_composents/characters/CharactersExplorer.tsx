"use client";

import CharactersGrid from "@/app/_composents/characters/CharactersGrid";
import Pagination from "@/app/_composents/ui/Pagination";
import EmptyState from "@/app/_composents/EmptyState";
import GroupeCard from "@/app/_composents/groupes/GroupeCard";
import { Character, Groupe } from "@/lib/db";
import {
  GROUPE_TYPES,
  GROUPE_TYPE_META,
  groupeHref,
  type GroupeType,
} from "@/lib/groupe-types";
import { cn, matchesSearch } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

const STORAGE_KEY = "characters-explorer-state";

type Vue = "personnages" | "groupes";
type TypeFilter = "all" | GroupeType;

type Props = {
  characters: Character[];
  groupes: Groupe[];
};

export default function CharactersExplorer({ characters, groupes }: Props) {
  const [vue, setVue] = useState<Vue>("personnages");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [versionFilter, setVersionFilter] = useState("all");
  const [etatFilter, setEtatFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortOrder>("a→z");
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);

  const [restored, setRestored] = useState(false);
  const perPageRef = useRef<number | null>(null);

  // Restaure filtres + page après un retour depuis une fiche personnage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.query === "string") setQuery(s.query);
        if (typeof s.versionFilter === "string")
          setVersionFilter(s.versionFilter);
        if (typeof s.etatFilter === "string") setEtatFilter(s.etatFilter);
        if (typeof s.roleFilter === "string") setRoleFilter(s.roleFilter);
        if (typeof s.sort === "string") setSort(s.sort);
        if (typeof s.page === "number" && s.page >= 1) setPage(s.page);
      }
    } catch {}
    // La vue (et le filtre de type) vivent dans l'adresse : partageable, et reprise au retour d'un groupe.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("vue") === "groupes") setVue("groupes");
      const t = params.get("type");
      if (t && (GROUPE_TYPES as string[]).includes(t)) {
        setTypeFilter(t as GroupeType);
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      const url = new URL(window.location.href);
      if (vue === "groupes") url.searchParams.set("vue", "groupes");
      else url.searchParams.delete("vue");
      if (vue === "groupes" && typeFilter !== "all") {
        url.searchParams.set("type", typeFilter);
      } else {
        url.searchParams.delete("type");
      }
      window.history.replaceState(null, "", url);
    } catch {}
  }, [restored, vue, typeFilter]);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          query,
          versionFilter,
          etatFilter,
          roleFilter,
          sort,
          page,
        }),
      );
    } catch {}
  }, [restored, query, versionFilter, etatFilter, roleFilter, sort, page]);

  useEffect(() => {
    const updatePerPage = () => {
      const next = getPerPage();
      // Ne remet à la page 1 que si le nombre par page change réellement
      if (perPageRef.current !== null && perPageRef.current !== next) {
        setPage(1);
      }
      perPageRef.current = next;
      setPerPage(next);
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

  // Groupes dont le nom correspond à la recherche (encart sur la vue Personnages).
  const matchingGroupes = useMemo(
    () =>
      query.trim() ? groupes.filter((g) => matchesSearch(g.nom, query)) : [],
    [groupes, query],
  );

  const groupesFiltered = useMemo(
    () =>
      groupes
        .filter(
          (g) =>
            (typeFilter === "all" || g.type === typeFilter) &&
            matchesSearch(g.nom, query),
        )
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [groupes, typeFilter, query],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const handlePageChange = (p: number) => setPage(p);

  const resetPage = () => setPage(1);

  const vueSwitch = (
    <div
      role="tablist"
      aria-label="Vue"
      className="inline-flex self-start rounded-lg border border-border bg-background p-0.5"
    >
      {(["personnages", "groupes"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={vue === v}
          onClick={() => setVue(v)}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
            vue === v
              ? "bg-accent text-accent-foreground"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {v === "personnages" ? "Personnages" : "Groupes"}
        </button>
      ))}
    </div>
  );

  if (vue === "groupes") {
    return (
      <section className="flex flex-col gap-4">
        {vueSwitch}
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un groupe, une entreprise..."
              className="h-9 w-full rounded-lg border border-border bg-background py-1 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/40"
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...GROUPE_TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={typeFilter === t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                  typeFilter === t
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-secondary hover:bg-muted",
                )}
              >
                {t === "all" ? "Tous" : GROUPE_TYPE_META[t].plural}
              </button>
            ))}
          </div>
        </div>
        {groupesFiltered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {groupesFiltered.map((g) => (
              <GroupeCard key={g.id} groupe={g} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {vueSwitch}
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

      {matchingGroupes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-secondary">
            {matchingGroupes.length} groupe
            {matchingGroupes.length > 1 ? "s correspondent" : " correspond"} :
          </span>
          {matchingGroupes.slice(0, 4).map((g) => (
            <Link
              key={g.id}
              href={groupeHref(g)}
              className="rounded-full border border-border px-3 py-1 font-medium hover:bg-muted"
            >
              {g.nom}
            </Link>
          ))}
          {matchingGroupes.length > 4 && (
            <button
              type="button"
              onClick={() => setVue("groupes")}
              className="font-medium text-accent hover:underline"
            >
              Voir tous les groupes
            </button>
          )}
        </div>
      )}

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
