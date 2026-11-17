"use client";

import type { CharacterPageData, LinkedCharacter } from "@/lib/character-page";
import {
  CARD_H,
  CARD_TOP,
  CARD_W,
  COUPLE_COLOR,
  FAMILY_COLOR,
  ROW_H,
  buildFamilyTree,
  relationSentence,
  stripLinkWord,
  type FamilyTree,
  type TreeCard,
  type TreeCardKind,
} from "@/lib/family-tree";
import { EXTENDED_GROUPS, type RelationKind } from "@/lib/relation-kinds";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import CharacterAvatar from "./CharacterAvatar";
import SectionTitle from "./SectionTitle";

type View = "arbre" | "liste";

const TREE_PAD = 24;
const personHref = (id: string) => `/personnages/${id}`;

// ─── Couleurs ────────────────────────────────────────────────────────────────

const CARD_STYLE: Record<
  TreeCardKind,
  { border: string; bg: string; pillBg: string; pillText: string; dashed?: boolean }
> = {
  self: { border: "#2F6FEB", bg: "#1C2840", pillBg: "#2F6FEB", pillText: "#FFFFFF" },
  famille: { border: "#2C3038", bg: "#1A1C21", pillBg: "#13213A", pillText: "#8AB4FF" },
  couple: { border: COUPLE_COLOR, bg: "#1A1C21", pillBg: "#2A1220", pillText: "#F39BC0" },
  marie: { border: FAMILY_COLOR, bg: "#1A1C21", pillBg: "#13213A", pillText: "#8AB4FF" },
  elargie: {
    border: "#4A4E58",
    bg: "#16181C",
    pillBg: "#1F2228",
    pillText: "#A3A8B3",
    dashed: true,
  },
};

const GREY = "#9AA0AA";
const FOE = /\b(ennemi|ennemie|rival|rivale)/i;
const FRIEND = /\b(ami|amie|amis|amies)\b/i;

const plain = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Couleur du libellé d'un lien « autre » : rouge pour un ennemi, vert pour un ami. */
function otherColor(label: string): string {
  const t = plain(label);
  if (FOE.test(t)) return "#FF8A8E";
  if (FRIEND.test(t)) return "#6EE7A0";
  return GREY;
}

function listLabelColor(kind: RelationKind, label: string): string {
  switch (kind) {
    case "couple":
      return "#F39BC0";
    case "ex":
      return GREY;
    case "autre":
      return otherColor(label);
    default:
      return "#8AB4FF";
  }
}

// ─── Petits éléments ─────────────────────────────────────────────────────────

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9AA0AA]">
      {children}
    </h3>
  );
}

/** Pastille arrondie vers la fiche d'un perso (Ex / Cœur, Autres liens). */
function Pill({ r, dashed }: { r: LinkedCharacter; dashed?: boolean }) {
  const color = dashed ? GREY : listLabelColor(r.kind, r.label);
  return (
    <Link
      href={personHref(r.id)}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border bg-[#1A1C21] py-1 pl-1 pr-3 text-[13px] hover:bg-[#1F2228]",
        dashed ? "border-dashed border-[#4A4E58]" : "border-solid border-[#2C3038]",
      )}
    >
      <CharacterAvatar nom={r.nom} imageUrl={r.imageUrl} size={24} />
      <span className="truncate font-semibold text-[#ECECEE]">{r.nom}</span>
      <span className="flex-none text-[12px] font-bold" style={{ color }}>
        {r.label}
      </span>
    </Link>
  );
}

/** Ex (et autres partenaires) puis Autres liens, sous l'arbre. */
function ExtraPills({
  hearts,
  others,
}: {
  hearts: LinkedCharacter[];
  others: LinkedCharacter[];
}) {
  if (hearts.length === 0 && others.length === 0) return null;
  const allEx = hearts.every((h) => h.kind === "ex");
  return (
    <div className="flex flex-col gap-4">
      {hearts.length > 0 && (
        <div className="flex flex-col gap-2">
          <GroupTitle>{allEx ? "Ex" : "Cœur"}</GroupTitle>
          <div className="flex flex-wrap gap-2">
            {hearts.map((r) => (
              <Pill key={r.relationId} r={r} dashed />
            ))}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          <GroupTitle>Autres liens</GroupTitle>
          <div className="flex flex-wrap gap-2">
            {others.map((r) => (
              <Pill key={r.relationId} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vue Arbre (à partir de sm) ──────────────────────────────────────────────

function Legend({ tree }: { tree: FamilyTree }) {
  const items = [
    {
      label: "Parent / enfant",
      show: tree.cards.some((k) => k.kind === "famille"),
      swatch: <span className="inline-block w-7 border-t-2 border-solid border-[#6E8FD6]" />,
    },
    {
      label: "Mariés",
      show: tree.badges.some((b) => b.symbol === "∞"),
      swatch: <span className="inline-block h-1 w-7 border-y-2 border-solid border-[#6E8FD6]" />,
    },
    {
      label: "En couple",
      show: tree.badges.some((b) => b.symbol === "♥"),
      swatch: <span className="inline-block w-7 border-t-[3px] border-solid border-[#E5649A]" />,
    },
    {
      label: "Famille élargie (sans trait)",
      show: tree.cards.some((k) => k.kind === "elargie"),
      swatch: <span className="inline-block size-3.5 rounded-[3px] border border-dashed border-[#4A4E58]" />,
    },
  ].filter((i) => i.show);

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[#C4C7CF]">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-flex">
            {i.swatch}
          </span>
          {i.label}
        </span>
      ))}
    </div>
  );
}

function TreeCardButton({
  card,
  selected,
  onSelect,
}: {
  card: TreeCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const s = CARD_STYLE[card.kind];
  const pill =
    card.kind === "couple" || card.kind === "marie" ? stripLinkWord(card.label) : card.label;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={card.sentence}
      aria-pressed={selected}
      className={cn(
        "absolute flex flex-col items-center gap-1 rounded-xl border-2 px-1.5 pt-2.5 text-center outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8AB4FF]",
        s.dashed ? "border-dashed" : "border-solid",
      )}
      style={{
        left: card.x,
        top: card.y,
        width: CARD_W,
        height: CARD_H,
        background: s.bg,
        borderColor: selected ? "#ECECEE" : s.border,
        boxShadow: selected ? "0 0 0 3px rgba(236,236,238,0.18)" : undefined,
      }}
    >
      <span
        className="max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight"
        style={{ background: s.pillBg, color: s.pillText }}
      >
        {pill}
      </span>
      <CharacterAvatar nom={card.nom} imageUrl={card.imageUrl} size={36} />
      <span className="line-clamp-2 text-[12px] font-bold leading-tight text-[#ECECEE]">
        {card.nom}
      </span>
      {card.joueur && (
        <span className="max-w-full truncate text-[11px] leading-tight text-[#9AA0AA]">
          {card.joueur}
        </span>
      )}
    </button>
  );
}

function TreeView({
  tree,
  hearts,
  others,
}: {
  tree: FamilyTree;
  hearts: LinkedCharacter[];
  others: LinkedCharacter[];
}) {
  const [selectedKey, setSelectedKey] = useState("self");
  const selected = tree.cards.find((k) => k.key === selectedKey) ?? tree.cards.find((k) => k.kind === "self")!;

  return (
    <div className="hidden flex-col gap-4 sm:flex">
      <Legend tree={tree} />

      <div className="flex overflow-hidden rounded-xl border border-[#23262D] bg-[#121418]">
        {/* Noms des rangées */}
        <div
          className="relative w-[150px] flex-none border-r border-[#23262D]"
          style={{ height: tree.height }}
        >
          {tree.bands.map((b) => (
            <div
              key={b.key}
              className={cn(
                "absolute inset-x-0 flex flex-col justify-center gap-0.5 px-4",
                b.current && "bg-[#151B28]",
              )}
              style={{ top: b.top, height: ROW_H }}
            >
              <span
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: b.current ? "#8AB4FF" : GREY }}
              >
                {b.label}
              </span>
              <span className="text-[12px] text-[#6E7380]">{b.hint}</span>
            </div>
          ))}
        </div>

        {/* Arbre */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="relative w-full"
            style={{ height: tree.height, minWidth: tree.width + TREE_PAD * 2 }}
          >
            {tree.bands.map((b) => (
              <div
                key={b.key}
                aria-hidden
                className={cn("absolute inset-x-0", b.current && "bg-[#151B28]")}
                style={{ top: b.top, height: ROW_H }}
              />
            ))}

            <div
              className="absolute left-1/2 top-0"
              style={{ width: tree.width, height: tree.height, marginLeft: -tree.width / 2 }}
            >
              {tree.lines.map((l, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="absolute"
                  style={{ left: l.x, top: l.y, width: l.w, height: l.h, background: l.color }}
                />
              ))}
              {tree.badges.map((b, i) => (
                <span
                  key={i}
                  aria-hidden
                  title={b.title}
                  className="absolute flex size-[22px] items-center justify-center rounded-full border bg-[#121418] text-[12px] font-bold leading-none"
                  style={{
                    left: b.x - 11,
                    top: b.y - 11,
                    color: b.color,
                    borderColor: b.color,
                  }}
                >
                  {b.symbol}
                </span>
              ))}
              {tree.cards.map((card) => (
                <TreeCardButton
                  key={card.key}
                  card={card}
                  selected={card.key === selected.key}
                  onSelect={() => setSelectedKey(card.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        role="status"
        className="flex items-start gap-2.5 rounded-lg bg-[#13213A] px-3.5 py-2.5 text-[14px] text-[#CFE0FF]"
      >
        <Info aria-hidden className="mt-0.5 size-4 flex-none" />
        <span className="min-w-0 flex-1">{selected.sentence}</span>
        {selected.kind !== "self" && (
          <Link
            href={personHref(selected.id)}
            className="flex-none font-semibold text-[#8AB4FF] underline-offset-2 hover:underline"
          >
            Voir la fiche →
          </Link>
        )}
      </div>

      <ExtraPills hearts={hearts} others={others} />
    </div>
  );
}

// ─── Vue Liste ───────────────────────────────────────────────────────────────

function ListCard({ r }: { r: LinkedCharacter }) {
  return (
    <Link
      href={personHref(r.id)}
      className="flex min-h-15 items-center gap-3 rounded-[10px] border border-[#2C3038] bg-[#1A1C21] px-3 py-2 hover:bg-[#1F2228]"
    >
      <CharacterAvatar nom={r.nom} imageUrl={r.imageUrl} size={40} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold leading-tight text-[#ECECEE]">
          {r.nom}
        </span>
        <span className="truncate text-[12px] text-[#9AA0AA]">
          <span className="font-bold" style={{ color: listLabelColor(r.kind, r.label) }}>
            {r.label}
          </span>
          {r.joueur ? ` · ${r.joueur}` : ""}
        </span>
      </span>
    </Link>
  );
}

function ListView({ relations, className }: { relations: LinkedCharacter[]; className: string }) {
  const of = (...kinds: RelationKind[]) => relations.filter((r) => kinds.includes(r.kind));
  const groups: { key: string; label: string; items: LinkedCharacter[] }[] = [
    { key: "parent", label: "Parents", items: of("parent") },
    { key: "fratrie", label: "Frères et sœurs", items: of("fratrie") },
    { key: "enfant", label: "Enfants", items: of("enfant") },
    { key: "coeur", label: "Cœur", items: of("marie", "couple", "ex") },
    ...EXTENDED_GROUPS.map((g) => ({ key: g.kind, label: g.label, items: of(g.kind) })),
    { key: "autre", label: "Autres liens", items: of("autre") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className={cn("flex-col gap-5", className)}>
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <GroupTitle>{g.label}</GroupTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
            {g.items.map((r) => (
              <ListCard key={r.relationId} r={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile : une carte par rangée ───────────────────────────────────────────

const MOBILE_ORDER: Record<TreeCardKind, number> = {
  self: 0,
  couple: 1,
  marie: 1,
  famille: 2,
  elargie: 3,
};

function MobileView({
  tree,
  hearts,
  others,
}: {
  tree: FamilyTree;
  hearts: LinkedCharacter[];
  others: LinkedCharacter[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {tree.bands.map((b) => {
        const cards = tree.cards
          .filter((k) => k.y === b.top + CARD_TOP)
          .sort((a, z) => MOBILE_ORDER[a.kind] - MOBILE_ORDER[z.kind] || a.x - z.x);
        return (
          <div
            key={b.key}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3",
              b.current ? "border-[#22385E] bg-[#151B28]" : "border-[#23262D] bg-[#121418]",
            )}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: b.current ? "#8AB4FF" : GREY }}
            >
              {b.label}
            </span>
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
              {cards.map((k) => {
                const s = CARD_STYLE[k.kind];
                const prefix = k.kind === "couple" ? "♥ " : k.kind === "marie" ? "∞ " : "";
                const label =
                  k.kind === "self" ? k.label : `${prefix}${k.kind === "couple" || k.kind === "marie" ? stripLinkWord(k.label) : k.label}`;
                const body = (
                  <>
                    <CharacterAvatar nom={k.nom} imageUrl={k.imageUrl} size={32} />
                    <span className="flex min-w-0 flex-col">
                      <span
                        className="truncate text-[10px] font-bold leading-tight"
                        style={{ color: s.pillText === "#FFFFFF" ? "#8AB4FF" : s.pillText }}
                      >
                        {label}
                      </span>
                      <span className="truncate text-[12px] font-semibold leading-tight text-[#ECECEE]">
                        {k.nom}
                      </span>
                    </span>
                  </>
                );
                const cls = cn(
                  "flex min-w-0 items-center gap-2 rounded-lg border-2 px-2 py-1.5",
                  s.dashed ? "border-dashed" : "border-solid",
                );
                const style = { background: s.bg, borderColor: s.border };
                return (
                  <li key={k.key} className="min-w-0">
                    {k.kind === "self" ? (
                      <div className={cls} style={style} aria-current="page">
                        {body}
                      </div>
                    ) : (
                      <Link href={personHref(k.id)} className={cls} style={style}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <ExtraPills hearts={hearts} others={others} />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export default function CharacterRelations({ c }: { c: CharacterPageData }) {
  const tree = useMemo(() => buildFamilyTree(c), [c]);
  const [view, setView] = useState<View>("arbre");

  if (c.relations.length === 0) return null;

  // Partenaires absents de l'arbre (ex, autres conjoints) et liens « autre ».
  const placed = new Set(tree?.cards.map((k) => k.key));
  const hearts = c.relations.filter(
    (r) => (r.kind === "ex" || r.kind === "couple" || r.kind === "marie") && !placed.has(r.relationId),
  );
  const others = c.relations.filter((r) => r.kind === "autre");
  const sentences = c.relations.map((r) => `${r.nom} · ${relationSentence(c.nom, r.label)}`);

  return (
    <section aria-labelledby="rel-h" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle id="rel-h">Relations</SectionTitle>
        {tree && (
          <div role="tablist" aria-label="Affichage des relations" className="hidden gap-1 sm:flex">
            {(["arbre", "liste"] as const).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-semibold",
                    active
                      ? "bg-[#ECECEE] text-[#0E0F12]"
                      : "border border-[#2C3038] text-[#C4C7CF] hover:bg-[#1A1C21]",
                  )}
                >
                  {v === "arbre" ? "Arbre" : "Liste"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <span className="sr-only">{sentences.join(". ")}.</span>

      {tree ? (
        <>
          {view === "arbre" && <TreeView tree={tree} hearts={hearts} others={others} />}
          {view === "liste" && <ListView relations={c.relations} className="hidden sm:flex" />}
          <MobileView tree={tree} hearts={hearts} others={others} />
        </>
      ) : (
        <ListView relations={c.relations} className="flex" />
      )}
    </section>
  );
}
