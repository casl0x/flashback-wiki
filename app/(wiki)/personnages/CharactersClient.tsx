"use client";

import Pagination from "@/components/Pagination";
import { SuggestButton } from "@/components/user/SuggestEditButton";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import EmptyState from "@/components/wiki/EmptyState";
import HeaderBlock from "@/components/wiki/HeaderBlock";
import { useSearch } from "@/components/wiki/SearchContext";
import { Character } from "@/lib/db";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PER_PAGE = 20;

type Props = {
  characters: Character[];
};

type DropdownOption = { label: string; value: string; color?: string | null };

function FilterDropdown({
  label,
  options,
  active,
  onChange,
  allLabel = "Tous",
}: {
  label: string;
  options: DropdownOption[];
  active: string;
  onChange: (val: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeOption = options.find((o) => o.value === active);
  const isFiltered = active !== "all";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          isFiltered
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card text-text-secondary hover:bg-muted hover:text-text-primary"
        }`}
      >
        {activeOption?.color && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: activeOption.color }}
          />
        )}
        <span className="text-text-faint font-normal">{label}</span>
        <span
          className={
            isFiltered ? "text-accent font-semibold" : "text-text-primary"
          }
        >
          {activeOption ? activeOption.label : allLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] rounded-lg border border-border bg-card shadow-lg">
          {/* Option "Tous" */}
          <button
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted first:rounded-t-lg"
          >
            <span className="h-2 w-2 shrink-0" />
            <span
              className={`flex-1 text-left ${active === "all" ? "font-semibold text-text-primary" : "text-text-secondary"}`}
            >
              {allLabel}
            </span>
            {active === "all" && <Check className="h-3 w-3 text-accent" />}
          </button>

          <div className="mx-2 h-px bg-border" />

          {/* Options */}
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted last:rounded-b-lg"
            >
              {o.color ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: o.color }}
                />
              ) : (
                <span className="h-2 w-2 shrink-0" />
              )}
              <span
                className={`flex-1 text-left ${active === o.value ? "font-semibold text-text-primary" : "text-text-secondary"}`}
              >
                {o.label}
              </span>
              {active === o.value && <Check className="h-3 w-3 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CharactersClient({ characters }: Props) {
  const ctx = useSearch();
  const query = ctx?.query ?? "";
  const [page, setPage] = useState(1);
  const prevQueryRef = useRef(query);

  const [roleFilter, setRoleFilter] = useState<"all" | "civil" | "illegal">(
    "all",
  );
  const [versionFilter, setVersionFilter] = useState<string>("all");
  const [etatVieFilter, setEtatVieFilter] = useState<string>("all");
  const [groupeFilter, setGroupeFilter] = useState<string>("all");
  const [metierFilter, setMetierFilter] = useState<string>("all");

  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    setPage(1);
  }

  const versions = [
    ...new Map(
      characters
        .filter((c) => c.version)
        .map((c) => [c.version!.id, c.version!]),
    ).values(),
  ];

  const etatsVie = [
    ...new Set(characters.map((c) => c.etatVie).filter(Boolean)),
  ] as string[];
  const groupes = [
    ...new Map(
      characters.flatMap((c) => c.groupes).map((g) => [g.id, g]),
    ).values(),
  ];
  const metiers = [
    ...new Set(characters.map((c) => c.metier).filter(Boolean)),
  ] as string[];

  const filtered = characters.filter((c) => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.player?.pseudo?.toLowerCase().includes(q) ||
      c.metier?.toLowerCase().includes(q);

    return (
      matchSearch &&
      (roleFilter === "all" || c.role === roleFilter) &&
      (versionFilter === "all" || c.versionId === versionFilter) &&
      (etatVieFilter === "all" || c.etatVie === etatVieFilter) &&
      (groupeFilter === "all" ||
        c.groupes.some((g) => g.id === groupeFilter)) &&
      (metierFilter === "all" || c.metier === metierFilter)
    );
  });

  const resetPage = () => setPage(1);

  const hasActiveFilters =
    roleFilter !== "all" ||
    versionFilter !== "all" ||
    etatVieFilter !== "all" ||
    groupeFilter !== "all" ||
    metierFilter !== "all";

  const resetAll = () => {
    setRoleFilter("all");
    setVersionFilter("all");
    setEtatVieFilter("all");
    setGroupeFilter("all");
    setMetierFilter("all");
    resetPage();
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
            <FilterDropdown
              label="Rôle · "
              allLabel="Tous"
              active={roleFilter}
              onChange={(v) => {
                setRoleFilter(v as typeof roleFilter);
                resetPage();
              }}
              options={[
                { label: "Civil", value: "civil" },
                { label: "Illégal", value: "illegal" },
              ]}
            />

            <FilterDropdown
              label="Version · "
              allLabel="Toutes"
              active={versionFilter}
              onChange={(v) => {
                setVersionFilter(v);
                resetPage();
              }}
              options={versions.map((v) => ({
                label: v.label,
                value: v.id,
                color: v.color,
              }))}
            />

            {etatsVie.length > 0 && (
              <FilterDropdown
                label="État de vie · "
                allLabel="Tous"
                active={etatVieFilter}
                onChange={(v) => {
                  setEtatVieFilter(v);
                  resetPage();
                }}
                options={etatsVie.map((e) => ({ label: e, value: e }))}
              />
            )}

            {hasActiveFilters && (
              <button
                onClick={resetAll}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-muted hover:text-text-primary"
              >
                Réinitialiser
              </button>
            )}

            <div className="flex flex-1 justify-end">
              <SuggestButton mode="create" />
            </div>
          </div>

          {/* Description de la version filtrée */}
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
