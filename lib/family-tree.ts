import type { CharacterPageData, LinkedCharacter } from "@/lib/character-page";

// ─── Mise en page de l'arbre généalogique (fonction pure, sans DOM) ──────────
// Toutes les coordonnées sont en pixels, dans le repère de l'arbre
// (la carte la plus à gauche est à x = 0).

export const CARD_W = 112;
export const CARD_H = 132;
export const ROW_H = 164;
export const CARD_TOP = 16;
export const CARD_GAP = 16;
export const SPOUSE_GAP = 40;
export const EXTENDED_GAP = 48;

export const FAMILY_COLOR = "#6E8FD6";
export const COUPLE_COLOR = "#E5649A";

const FAMILY_STROKE = 2;
const COUPLE_STROKE = 3;

export type TreeCardKind = "self" | "famille" | "couple" | "marie" | "elargie";

export type TreeBand = {
  key: string;
  label: string;
  hint: string;
  top: number;
  current: boolean;
};

export type TreeCard = {
  key: string;
  id: string;
  nom: string;
  imageUrl: string | null;
  label: string;
  joueur: string | null;
  kind: TreeCardKind;
  x: number;
  y: number;
  sentence: string;
};

export type TreeLine = { x: number; y: number; w: number; h: number; color: string };

/** `x` et `y` sont le centre du badge. */
export type TreeBadge = {
  x: number;
  y: number;
  symbol: "∞" | "♥";
  color: string;
  title: string;
};

export type FamilyTree = {
  width: number;
  height: number;
  bands: TreeBand[];
  cards: TreeCard[];
  lines: TreeLine[];
  badges: TreeBadge[];
};

// ─── Phrases ─────────────────────────────────────────────────────────────────

const firstWord = (nom: string) => nom.trim().split(/\s+/)[0] ?? nom;

const startsWithVowel = (word: string) =>
  /^[aeiouyhàâäéèêëîïôöùûü]/i.test(word.normalize("NFC"));

/** « En couple avec » → « En couple », « Père de » → « Père » (pour la pastille). */
export function stripLinkWord(label: string): string {
  return label.replace(/\s+(avec|de|d['’])$/i, "").trim();
}

// « En couple », « Marié(e) » prennent « avec » ; les noms (« Père », « Mari »…) prennent « de ».
const WITH_LABEL = /^(en couple|couple|marie|mariee|maries|mariees)(\(e\)|\(es\))?(\s|$)/;

const plain = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** « Père de Jada », « En couple avec Jada », « Père d'Ana ». */
export function relationSentence(selfName: string, label: string): string {
  const first = firstWord(selfName);
  const text = label.trim();
  const elide = (prep: string) =>
    prep === "de" && startsWithVowel(first) ? `d'${first}` : `${prep} ${first}`;

  if (/\s(avec)$/i.test(text) || /^avec$/i.test(text)) return `${text} ${first}`;
  if (/(^|\s)de$/i.test(text)) {
    const base = text.replace(/\s*de$/i, "");
    return `${base} ${elide("de")}`.trim();
  }
  if (/(^|\s)d['’]$/i.test(text)) return `${text}${first}`;
  return `${text} ${WITH_LABEL.test(plain(text)) ? elide("avec") : elide("de")}`;
}

function cardSentence(selfName: string, other: LinkedCharacter): string {
  return `${other.nom} · ${relationSentence(selfName, other.label)}`;
}

// ─── Construction ────────────────────────────────────────────────────────────

type RowKey = "grands-parents" | "parents" | "self" | "enfants" | "petits-enfants";

const ROWS: { key: RowKey; label: string; hint: string }[] = [
  { key: "grands-parents", label: "Grands-parents", hint: "2 générations au-dessus" },
  { key: "parents", label: "Parents", hint: "1 génération au-dessus" },
  { key: "self", label: "Sa génération", hint: "Frères, sœurs, couple" },
  { key: "enfants", label: "Enfants", hint: "1 génération en dessous" },
  { key: "petits-enfants", label: "Petits-enfants", hint: "2 générations en dessous" },
];

const spanOf = (count: number, gap: number) =>
  count === 0 ? 0 : count * CARD_W + (count - 1) * gap;

export function buildFamilyTree(c: CharacterPageData): FamilyTree | null {
  const of = (...kinds: LinkedCharacter["kind"][]) =>
    c.relations.filter((r) => kinds.includes(r.kind));

  const parents = of("parent");
  const siblings = of("fratrie");
  const children = of("enfant");
  const spouse = of("marie")[0] ?? of("couple")[0] ?? null;
  const grandparents = of("grand-parent");
  const uncles = of("oncle-tante");
  const cousins = of("cousin");
  const nephews = of("neveu-niece");
  const grandchildren = of("petit-enfant");

  const placedCount =
    parents.length +
    siblings.length +
    children.length +
    (spouse ? 1 : 0) +
    grandparents.length +
    uncles.length +
    cousins.length +
    nephews.length +
    grandchildren.length;
  if (placedCount === 0) return null;

  // Rangées visibles et leur position verticale.
  const rowSize: Record<RowKey, number> = {
    "grands-parents": grandparents.length,
    parents: parents.length + uncles.length,
    self: 1,
    enfants: children.length + nephews.length,
    "petits-enfants": grandchildren.length,
  };
  const visible = ROWS.filter((r) => r.key === "self" || rowSize[r.key] > 0);
  const rowTop = (key: RowKey) => visible.findIndex((r) => r.key === key) * ROW_H;
  const hasRow = (key: RowKey) => visible.some((r) => r.key === key);

  const cards: TreeCard[] = [];
  const lines: TreeLine[] = [];
  const badges: TreeBadge[] = [];

  const selfName = c.nom;
  const addCard = (
    row: RowKey,
    x: number,
    other: LinkedCharacter,
    kind: TreeCardKind,
  ): TreeCard => {
    const card: TreeCard = {
      key: other.relationId,
      id: other.id,
      nom: other.nom,
      imageUrl: other.imageUrl,
      label: other.label,
      joueur: other.joueur,
      kind,
      x,
      y: rowTop(row) + CARD_TOP,
      sentence: cardSentence(selfName, other),
    };
    cards.push(card);
    return card;
  };

  const vLine = (cx: number, y: number, h: number, color = FAMILY_COLOR, w = FAMILY_STROKE) =>
    lines.push({ x: cx - w / 2, y, w, h, color });
  const hLine = (x: number, cy: number, w: number, color = FAMILY_COLOR, h = FAMILY_STROKE) =>
    lines.push({ x, y: cy - h / 2, w, h, color });

  /** Rangée de cartes contiguës (écart `CARD_GAP`) à partir de `start`. */
  const placeRow = (
    row: RowKey,
    start: number,
    list: LinkedCharacter[],
    kind: TreeCardKind,
    gap = CARD_GAP,
  ) => list.map((r, i) => addCard(row, start + i * (CARD_W + gap), r, kind));

  /** Famille élargie : à droite de la famille proche, ou centrée sur `center` s'il n'y en a pas. */
  const placeExtended = (
    row: RowKey,
    list: LinkedCharacter[],
    closeRight: number | null,
    center: number,
  ) => {
    if (list.length === 0) return;
    const start =
      closeRight !== null
        ? closeRight + EXTENDED_GAP
        : center - spanOf(list.length, CARD_GAP) / 2;
    placeRow(row, start, list, "elargie");
  };

  // 1. Sa génération : fratrie, fiche, conjoint·e.
  const selfX = siblings.length * (CARD_W + CARD_GAP);
  const selfC = selfX + CARD_W / 2;
  const siblingCards = placeRow("self", 0, siblings, "famille");
  const selfCard: TreeCard = {
    key: "self",
    id: c.id,
    nom: c.nom,
    imageUrl: c.imageUrl,
    label: "Cette fiche",
    joueur: c.player?.pseudo ?? null,
    kind: "self",
    x: selfX,
    y: rowTop("self") + CARD_TOP,
    sentence: `${c.nom} · la fiche que tu regardes. Clique sur un proche pour lire son lien.`,
  };
  cards.push(selfCard);

  const curTop = rowTop("self");
  const curMid = curTop + CARD_TOP + CARD_H / 2;
  const spouseX = selfX + CARD_W + SPOUSE_GAP;
  if (spouse) {
    addCard("self", spouseX, spouse, spouse.kind === "marie" ? "marie" : "couple");
    const gapCx = selfX + CARD_W + SPOUSE_GAP / 2;
    if (spouse.kind === "marie") {
      hLine(selfX + CARD_W, curMid - 3, SPOUSE_GAP);
      hLine(selfX + CARD_W, curMid + 3, SPOUSE_GAP);
      badges.push({ x: gapCx, y: curMid, symbol: "∞", color: FAMILY_COLOR, title: "Mariés" });
    } else {
      hLine(selfX + CARD_W, curMid, SPOUSE_GAP, COUPLE_COLOR, COUPLE_STROKE);
      badges.push({ x: gapCx, y: curMid, symbol: "♥", color: COUPLE_COLOR, title: "En couple" });
    }
  }
  const curRight = spouse ? spouseX + CARD_W : selfX + CARD_W;
  placeExtended("self", cousins, curRight, selfC);

  // 2. Barre de fratrie.
  const firstC = siblings.length > 0 ? CARD_W / 2 : selfC;
  const sibMid = (firstC + selfC) / 2;
  if (siblings.length > 0) {
    hLine(firstC, curTop + FAMILY_STROKE / 2, selfC - firstC);
    for (const card of [...siblingCards, selfCard]) {
      vLine(card.x + CARD_W / 2, curTop, CARD_TOP);
    }
  }

  // 4. Parents, centrés au-dessus de la fratrie.
  if (hasRow("parents")) {
    const parTop = rowTop("parents");
    const parMid = parTop + CARD_TOP + CARD_H / 2;
    const parBottom = parTop + CARD_TOP + CARD_H;
    const start = sibMid - spanOf(parents.length, SPOUSE_GAP) / 2;
    const parentCards = placeRow("parents", start, parents, "famille", SPOUSE_GAP);

    if (parents.length > 0) {
      parentCards.slice(0, -1).forEach((p, i) => {
        const gx = p.x + CARD_W;
        const gapCx = gx + SPOUSE_GAP / 2;
        if (i === 0 && c.parentsLink === "marie") {
          hLine(gx, parMid - 3, SPOUSE_GAP);
          hLine(gx, parMid + 3, SPOUSE_GAP);
          badges.push({
            x: gapCx,
            y: parMid,
            symbol: "∞",
            color: FAMILY_COLOR,
            title: "Parents mariés",
          });
        } else {
          hLine(gx, parMid, SPOUSE_GAP);
        }
      });
      // Avec exactement deux parents, le trait part du milieu de leur lien.
      const fromY = parents.length === 2 ? parMid : parBottom;
      const toY = siblings.length > 0 ? curTop + FAMILY_STROKE : curTop + CARD_TOP;
      vLine(sibMid, fromY, toY - fromY);
    }

    const closeRight =
      parents.length > 0 ? start + spanOf(parents.length, SPOUSE_GAP) : null;
    placeExtended("parents", uncles, closeRight, sibMid);
  }

  // 0. Grands-parents : famille élargie, centrés au-dessus des parents.
  placeExtended("grands-parents", grandparents, null, sibMid);

  // 5. Enfants, centrés sous la fiche ou sous le milieu du couple.
  const anchor = spouse ? (selfX + spouseX + CARD_W) / 2 : selfC;
  if (hasRow("enfants")) {
    const kidTop = rowTop("enfants");
    const kidStart = anchor - spanOf(children.length, CARD_GAP) / 2;
    const kidCards = placeRow("enfants", kidStart, children, "famille");

    if (children.length > 0) {
      const fromY = spouse ? curMid : curTop + CARD_TOP + CARD_H;
      const toY = children.length === 1 ? kidTop + CARD_TOP : kidTop + FAMILY_STROKE;
      vLine(anchor, fromY, toY - fromY);
      if (children.length > 1) {
        const first = kidCards[0].x + CARD_W / 2;
        const last = kidCards[kidCards.length - 1].x + CARD_W / 2;
        hLine(first, kidTop + FAMILY_STROKE / 2, last - first);
        for (const k of kidCards) vLine(k.x + CARD_W / 2, kidTop, CARD_TOP);
      }
    }

    const closeRight = children.length > 0 ? kidStart + spanOf(children.length, CARD_GAP) : null;
    placeExtended("enfants", nephews, closeRight, anchor);
  }

  // Petits-enfants : famille élargie, centrés sous les enfants.
  placeExtended("petits-enfants", grandchildren, null, anchor);

  // 7. Recadrage : la carte la plus à gauche à x = 0.
  const minX = Math.min(...cards.map((k) => k.x));
  const maxX = Math.max(...cards.map((k) => k.x + CARD_W));
  for (const k of cards) k.x -= minX;
  for (const l of lines) l.x -= minX;
  for (const b of badges) b.x -= minX;

  return {
    width: maxX - minX,
    height: visible.length * ROW_H,
    bands: visible.map((r) => ({
      key: r.key,
      label: r.label,
      hint: r.hint,
      top: rowTop(r.key),
      current: r.key === "self",
    })),
    cards,
    lines,
    badges,
  };
}
