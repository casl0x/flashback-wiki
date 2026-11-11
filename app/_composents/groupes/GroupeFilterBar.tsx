"use client";

import {
  FilterChip,
  type SortOrder,
  type VersionOption,
} from "@/app/_composents/characters/CharacterFilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GROUPE_STATUTS,
  GROUPE_STATUT_LABEL,
  GROUPE_TYPES,
  GROUPE_TYPE_META,
  type GroupeStatut,
  type GroupeType,
} from "@/lib/groupe-types";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

export type GroupeTypeFilter = "all" | GroupeType;
export type GroupeStatutFilter = "all" | GroupeStatut;
export type GroupeEtatFilter = "all" | "actif" | "dissous";
/** Valeur du filtre de catégorie pour les groupes sans catégorie. */
export const NO_CATEGORIE = "__none__";

export type CategorieOption = { id: string; nom: string; type: GroupeType };

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  versions: VersionOption[];
  versionFilter: string;
  onVersionChange: (value: string) => void;
  typeFilter: GroupeTypeFilter;
  onTypeChange: (value: GroupeTypeFilter) => void;
  categories: CategorieOption[];
  catFilter: string;
  onCatChange: (value: string) => void;
  statutFilter: GroupeStatutFilter;
  onStatutChange: (value: GroupeStatutFilter) => void;
  etatFilter: GroupeEtatFilter;
  onEtatChange: (value: GroupeEtatFilter) => void;
  sort: SortOrder;
  onSortChange: (value: SortOrder) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  resultCount: number;
};

const chipCls = (selected: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    selected
      ? "border-accent bg-accent/10 text-accent"
      : "border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary"
  }`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/** Barre de filtres de la vue Groupes : même présentation que celle des personnages. */
export default function GroupeFilterBar({
  query,
  onQueryChange,
  versions,
  versionFilter,
  onVersionChange,
  typeFilter,
  onTypeChange,
  categories,
  catFilter,
  onCatChange,
  statutFilter,
  onStatutChange,
  etatFilter,
  onEtatChange,
  sort,
  onSortChange,
  showPanel,
  onTogglePanel,
  resultCount,
}: Props) {
  const activeFilterCount = [
    versionFilter !== "all",
    typeFilter !== "all",
    statutFilter !== "all",
    catFilter !== "all",
    etatFilter !== "all",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const resetAll = () => {
    onVersionChange("all");
    onTypeChange("all");
    onEtatChange("all");
  };

  // Les sous-filtres dépendent du type choisi : statut pour les groupes, catégories pour les autres.
  const categoriesOfType = categories.filter((c) => c.type === typeFilter);
  const showCategories =
    typeFilter === "ENTREPRISE" || typeFilter === "SERVICE_PUBLIC";
  const activeVersion = versions.find((v) => v.id === versionFilter);
  const catLabel =
    catFilter === NO_CATEGORIE
      ? "Autres"
      : categories.find((c) => c.id === catFilter)?.nom;

  return (
    <div className="flex flex-col gap-2">
      {/* ── Ligne principale ── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un groupe, une entreprise..."
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
          {versions.length > 0 && (
            <Section title="Version">
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
            </Section>
          )}

          <Section title="Type">
            {GROUPE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onTypeChange(typeFilter === t ? "all" : t)}
                className={chipCls(typeFilter === t)}
              >
                {GROUPE_TYPE_META[t].plural}
              </button>
            ))}
          </Section>

          {typeFilter === "GROUPE" && (
            <Section title="Statut">
              {GROUPE_STATUTS.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatutChange(statutFilter === s ? "all" : s)}
                  className={chipCls(statutFilter === s)}
                >
                  {GROUPE_STATUT_LABEL[s]}
                </button>
              ))}
            </Section>
          )}

          {showCategories && (
            <Section title="Catégorie">
              {categoriesOfType.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCatChange(catFilter === c.id ? "all" : c.id)}
                  className={chipCls(catFilter === c.id)}
                >
                  {c.nom}
                </button>
              ))}
              <button
                onClick={() =>
                  onCatChange(catFilter === NO_CATEGORIE ? "all" : NO_CATEGORIE)
                }
                className={chipCls(catFilter === NO_CATEGORIE)}
              >
                Autres
              </button>
            </Section>
          )}

          <Section title="Activité">
            {(
              [
                ["actif", "Actifs"],
                ["dissous", "Dissous"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() =>
                  onEtatChange(etatFilter === value ? "all" : value)
                }
                className={chipCls(etatFilter === value)}
              >
                {label}
              </button>
            ))}
          </Section>
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
          {typeFilter !== "all" && (
            <FilterChip
              label={GROUPE_TYPE_META[typeFilter].plural}
              onRemove={() => onTypeChange("all")}
            />
          )}
          {statutFilter !== "all" && (
            <FilterChip
              label={GROUPE_STATUT_LABEL[statutFilter]}
              onRemove={() => onStatutChange("all")}
            />
          )}
          {catFilter !== "all" && catLabel && (
            <FilterChip label={catLabel} onRemove={() => onCatChange("all")} />
          )}
          {etatFilter !== "all" && (
            <FilterChip
              label={etatFilter === "actif" ? "Actifs" : "Dissous"}
              onRemove={() => onEtatChange("all")}
            />
          )}

          <button
            onClick={resetAll}
            className="text-text-faint underline-offset-2 hover:text-text-primary hover:underline"
          >
            Tout effacer
          </button>

          <span className="ml-auto text-text-faint">
            {resultCount} résultat{resultCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
