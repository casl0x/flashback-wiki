import "server-only";

import type { Prisma } from "@prisma/client";

export type PlayerFilters = {
  q?: string;
  badge?: string;
  chaine?: string;
  compte?: string;
  persos?: string;
};

export function playerWhere(f: PlayerFilters): Prisma.PlayerWhereInput {
  const and: Prisma.PlayerWhereInput[] = [];
  const q = f.q?.trim();
  if (q) {
    and.push({
      OR: [
        { pseudo: { contains: q, mode: "insensitive" } },
        { userProfile: { pseudo: { contains: q, mode: "insensitive" } } },
        { characters: { some: { nom: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.badge === "none") and.push({ badges: { isEmpty: true } });
  else if (f.badge) and.push({ badges: { has: f.badge } });
  if (f.chaine === "oui") and.push({ chaines: { isEmpty: false } });
  else if (f.chaine === "non") and.push({ chaines: { isEmpty: true } });
  if (f.compte === "oui") and.push({ userProfile: { isNot: null } });
  else if (f.compte === "non") and.push({ userProfile: { is: null } });
  if (f.persos === "oui") and.push({ characters: { some: {} } });
  else if (f.persos === "non") and.push({ characters: { none: {} } });
  return and.length ? { AND: and } : {};
}
