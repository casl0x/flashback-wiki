"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ETAT_VIE_CONFIG } from "./LifeStateIcon";

export type RoleFilter = "all" | "civil" | "illegal";
export type SortOrder = "a→z" | "z→a";

export type VersionOption = {
  id: string;
  label: string;
  color: string | null;
  ordre: string;
};

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  versions: VersionOption[];
  versionFilter: string;
  onVersionChange: (value: string) => void;
  etatFilter: string;
  onEtatChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleChange: (value: RoleFilter) => void;
  sort: SortOrder;
  onSortChange: (value: SortOrder) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  resultCount: number;
};

const ROLE_LABELS: Record<RoleFilter, string> = {
  all: "Tous les rôles",
  civil: "Civil",
  illegal: "Illégal",
};

export default function CharacterFilterBar({
  query,
  onQueryChange,
  versions,
  versionFilter,
  onVersionChange,
  etatFilter,
  onEtatChange,
  roleFilter,
  onRoleChange,
  sort,
  onSortChange,
  showPanel,
  onTogglePanel,
  resultCount,
}: Props) {
  const activeFilterCount = [
    versionFilter !== "all",
    etatFilter !== "all",
    roleFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const resetAll = () => {
    onVersionChange("all");
    onEtatChange("all");
    onRoleChange("all");
  };

  const activeVersion = versions.find((v) => v.id === versionFilter);
  const activeEtat = ETAT_VIE_CONFIG.find((e) => e.key === etatFilter);
  const activeRole = ROLE_LABELS[roleFilter];

  return (
    <div className="flex flex-col gap-2">
      {/* ── Ligne principale ── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un perso, un joueur, un groupe..."
            className="h-9 w-full rounded-lg border border-border bg-background py-1 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/40"
            suppressHydrationWarning
          />
        </div>

        <button
          onClick={onTogglePanel}
          aria-expanded={showPanel}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
            showPanel || hasActiveFilters
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          {hasActiveFilters && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        <Select
          value={sort}
          onValueChange={(v) => v && onSortChange(v as SortOrder)}
        >
          <SelectTrigger className="h-9">
            {sort === "a→z" ? (
              <ArrowDownAZ className="h-3.5 w-3.5 text-text-faint" />
            ) : (
              <ArrowUpZA className="h-3.5 w-3.5 text-text-faint" />
            )}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a→z">A → Z</SelectItem>
            <SelectItem value="z→a">Z → A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Panneau de filtres ── */}
      {showPanel && (
        <div className="space-y-4 border rounded-md p-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Version
            </p>
            <div className="flex flex-wrap gap-1.5">
              {versions.map((v) => {
                const selected = v.id === versionFilter;
                return (
                  <button
                    key={v.id}
                    onClick={() => onVersionChange(selected ? "all" : v.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-transparent text-white"
                        : "border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary"
                    }`}
                    style={
                      selected
                        ? { backgroundColor: v.color ?? "var(--accent)" }
                        : undefined
                    }
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              État
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ETAT_VIE_CONFIG.map((e) => {
                const selected = e.key === etatFilter;
                const Icon = e.icon;
                return (
                  <button
                    key={e.key}
                    onClick={() => onEtatChange(selected ? "all" : e.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Rôle
            </p>
            <Select
              value={roleFilter}
              onValueChange={(v) => v && onRoleChange(v as RoleFilter)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="illegal">Illégal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ── Filtres actifs ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-xs">
          {activeVersion && (
            <FilterChip
              label={activeVersion.label}
              color={activeVersion.color}
              onRemove={() => onVersionChange("all")}
            />
          )}
          {activeEtat && (
            <FilterChip
              label={activeEtat.label}
              onRemove={() => onEtatChange("all")}
            />
          )}
          {activeRole && (
            <FilterChip
              label={activeRole}
              onRemove={() => onRoleChange("all")}
            />
          )}

          <button
            onClick={resetAll}
            className="text-text-faint underline-offset-2 hover:text-text-primary hover:underline"
          >
            Tout effacer
          </button>

          <span className="ml-auto text-text-faint">
            {resultCount} résultat{resultCount !== 1 ? "s" : ""} sur cette page
          </span>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string | null;
  onRemove: () => void;
}) {
  return (
    <span
      className="flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-2 py-0.5 font-medium text-accent"
      style={
        color
          ? { borderColor: color, backgroundColor: `${color}1a`, color }
          : undefined
      }
    >
      {label}
      <button onClick={onRemove} aria-label={`Retirer le filtre ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
