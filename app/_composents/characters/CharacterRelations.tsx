import type { CharacterPageData, LinkedCharacter } from "@/lib/character-page";
import { EXTENDED_GROUPS, type RelationKind } from "@/lib/relation-kinds";
import { cn } from "@/lib/utils";
import Link from "next/link";
import CharacterAvatar from "./CharacterAvatar";
import SectionTitle from "./SectionTitle";

// Couleurs des liens : famille en bleu, couple en rose, ex en gris pointillé.
const FAMILY = "#6E8FD6";
const HEART: Record<
  "couple" | "marie" | "ex",
  { color: string; line: string; label: string }
> = {
  couple: {
    color: "#E5649A",
    line: "border-t-[3px] border-solid border-[#E5649A]",
    label: "En couple",
  },
  marie: {
    color: "#6E8FD6",
    line: "h-1 border-y-2 border-solid border-[#6E8FD6]",
    label: "Mariés",
  },
  ex: {
    color: "#6B707A",
    line: "border-t-2 border-dashed border-[#9AA0AA]",
    label: "Ex",
  },
};

const meta = (r: LinkedCharacter, withLabel: boolean) =>
  [withLabel ? r.label : null, r.joueur].filter(Boolean).join(" · ");

/** Carte d'un perso dans l'arbre (format vertical). */
function TreeCard({
  r,
  self,
}: {
  r: LinkedCharacter | { id: string; nom: string; imageUrl: string | null };
  self?: boolean;
}) {
  const linked = "relationId" in r ? r : null;
  const inner = (
    <>
      <CharacterAvatar nom={r.nom} imageUrl={r.imageUrl} size={44} />
      <span className="line-clamp-2 text-[13px] font-semibold leading-tight text-[#ECECEE]">
        {r.nom}
      </span>
      <span className="line-clamp-2 text-[11px] text-[#9AA0AA]">
        {self
          ? "Cette fiche"
          : linked
            ? meta(linked, linked.kind !== "fratrie")
            : ""}
      </span>
    </>
  );
  const cls = cn(
    "flex min-h-[128px] w-[112px] flex-col items-center gap-1 rounded-[10px] border-2 px-1.5 py-2.5 text-center",
    self
      ? "border-[#2F6FEB] bg-[#1C2840]"
      : "border-[#2C3038] bg-[#1A1C21] hover:border-[#4A4E58]",
  );
  return self ? (
    <div className={cls} aria-current="page">
      {inner}
    </div>
  ) : (
    <Link href={`/personnages/${r.id}`} className={cls}>
      {inner}
    </Link>
  );
}

/** Rangée reliée par une barre horizontale, chaque carte pendue par un trait vertical. */
function HangingRow({
  children,
  count,
}: {
  children: React.ReactNode[];
  count: number;
}) {
  return (
    <ul className="m-0 flex list-none justify-center p-0">
      {children.map((child, i) => (
        <li key={i} className="relative flex flex-col items-center px-1 pt-5">
          {count > 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5",
                i === 0
                  ? "left-1/2 right-0"
                  : i === count - 1
                    ? "left-0 right-1/2"
                    : "inset-x-0",
              )}
              style={{ background: FAMILY }}
            />
          )}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2"
            style={{ background: FAMILY }}
          />
          {child}
        </li>
      ))}
    </ul>
  );
}

const Stem = () => (
  <span
    aria-hidden
    className="mx-auto block h-5 w-0.5"
    style={{ background: FAMILY }}
  />
);

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9AA0AA]">
      {children}
    </span>
  );
}

/** Carte horizontale (cœur, famille élargie, autres liens). */
function WideCard({
  r,
  accent,
  line,
}: {
  r: LinkedCharacter;
  accent?: string;
  line?: string;
}) {
  return (
    <Link
      href={`/personnages/${r.id}`}
      className="flex min-h-15 items-center gap-2.5 rounded-[10px] border-2 bg-[#1A1C21] px-2.5 py-2 hover:bg-[#1F2228]"
      style={{ borderColor: accent ?? "#2C3038" }}
    >
      <CharacterAvatar nom={r.nom} imageUrl={r.imageUrl} size={36} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-semibold leading-tight text-[#ECECEE]">
          {r.nom}
        </span>
        <span className="flex items-center gap-1.5 truncate text-[11px]">
          {line && (
            <span
              aria-hidden
              className={cn("inline-block w-4 flex-none", line)}
            />
          )}
          <span
            className="font-bold"
            style={{ color: accent && accent !== "#2C3038" ? accent : FAMILY }}
          >
            {r.label}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function CharacterRelations({ c }: { c: CharacterPageData }) {
  const rels = c.relations;
  if (rels.length === 0) return null;

  const of = (...kinds: RelationKind[]) =>
    rels.filter((r) => kinds.includes(r.kind));
  const parents = of("parent");
  const siblings = of("fratrie");
  const children = of("enfant");
  const heart = of("couple", "marie", "ex").sort(
    (a, b) => (a.kind === "ex" ? 1 : 0) - (b.kind === "ex" ? 1 : 0),
  );
  const extended = EXTENDED_GROUPS.map((g) => ({
    ...g,
    items: of(g.kind),
  })).filter((g) => g.items.length > 0);
  const others = of("autre");

  const hasTree = parents.length + siblings.length + children.length > 0;
  const self = { id: c.id, nom: c.nom, imageUrl: c.imageUrl };
  // La fiche se place au milieu de sa fratrie.
  const row = [...siblings.map((s) => <TreeCard key={s.relationId} r={s} />)];
  row.splice(
    Math.ceil(row.length / 2),
    0,
    <TreeCard key="self" r={self} self />,
  );

  const legend = [
    {
      label: "Filiation",
      line: "border-t-2 border-solid border-[#6E8FD6]",
      show: hasTree,
    },
    ...(["marie", "couple", "ex"] as const).map((k) => ({
      label: HEART[k].label,
      line: HEART[k].line,
      show: heart.some((h) => h.kind === k),
    })),
  ].filter((l) => l.show);

  return (
    <section aria-labelledby="rel-h" className="flex flex-col gap-4">
      <SectionTitle id="rel-h">Relations</SectionTitle>

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[#C4C7CF]">
          {legend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-2">
              <span aria-hidden className={cn("inline-block w-7", l.line)} />
              {l.label}
            </span>
          ))}
        </div>
      )}

      {hasTree && (
        <>
          {/* Desktop : arbre */}
          <div className="hidden overflow-x-auto rounded-xl border border-[#23262D] bg-[#121418] p-6 sm:block">
            <div className="mx-auto flex w-max min-w-full flex-col items-center">
              {parents.length > 0 && (
                <>
                  <RowLabel>Parents</RowLabel>
                  <div className="mt-2 flex items-center">
                    {parents.map((p, i) => (
                      <div key={p.relationId} className="flex items-center">
                        {i > 0 && (
                          <span
                            aria-hidden
                            className="h-0.5 w-5"
                            style={{ background: FAMILY }}
                          />
                        )}
                        <TreeCard r={p} />
                      </div>
                    ))}
                  </div>
                  <Stem />
                </>
              )}

              {siblings.length > 0 && !parents.length && (
                <RowLabel>Fratrie</RowLabel>
              )}
              {parents.length > 0 || siblings.length > 0 ? (
                <HangingRow count={row.length}>{row}</HangingRow>
              ) : (
                <TreeCard r={self} self />
              )}

              {children.length > 0 && (
                <>
                  <Stem />
                  <HangingRow count={children.length}>
                    {children.map((ch) => (
                      <TreeCard key={ch.relationId} r={ch} />
                    ))}
                  </HangingRow>
                  <span className="mt-2">
                    <RowLabel>Enfants</RowLabel>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mobile : listes par niveau */}
          <div className="flex flex-col gap-4 sm:hidden">
            {[
              { label: "Parents", items: parents },
              { label: "Fratrie", items: siblings },
              { label: "Enfants", items: children },
            ]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div key={g.label} className="flex flex-col gap-2">
                  <RowLabel>{g.label}</RowLabel>
                  {g.items.map((r) => (
                    <WideCard key={r.relationId} r={r} />
                  ))}
                </div>
              ))}
          </div>
        </>
      )}

      {heart.length > 0 && (
        <div className="flex flex-col gap-2">
          <RowLabel>Cœur</RowLabel>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {heart.map((h) => {
              const k = h.kind as "couple" | "marie" | "ex";
              return (
                <WideCard
                  key={h.relationId}
                  r={h}
                  accent={HEART[k].color}
                  line={HEART[k].line}
                />
              );
            })}
          </div>
        </div>
      )}

      {extended.length > 0 && (
        <div className="flex flex-col gap-4 pt-1">
          <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C4C7CF]">
            Famille élargie
          </h3>
          {extended.map((g) => (
            <div key={g.kind} className="flex flex-col gap-2">
              <h4 className="m-0 text-[12px] font-semibold text-[#9AA0AA]">
                {g.label}
              </h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
                {g.items.map((r) => (
                  <WideCard key={r.relationId} r={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C4C7CF]">
            Autres liens
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {others.map((r) => (
              <WideCard key={r.relationId} r={r} accent="#2C3038" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
