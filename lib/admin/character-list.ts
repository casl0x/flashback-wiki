import "server-only";

import type { EtatVie, Prisma, Role } from "@prisma/client";

export type CharacterFilters = { q?: string; version?: string; etat?: string; groupe?: string; role?: string };

const ETATS = ["EN_VIE", "MORT", "PARTI", "DISPARU", "PRISON"];

export function characterWhere(f: CharacterFilters): Prisma.CharacterWhereInput {
  const and: Prisma.CharacterWhereInput[] = [];
  const q = f.q?.trim();
  if (q) {
    and.push({
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { player: { pseudo: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (f.version === "none") and.push({ versions: { none: {} } });
  else if (f.version) and.push({ versions: { some: { id: f.version } } });
  if (f.etat && ETATS.includes(f.etat)) and.push({ etatVie: f.etat as EtatVie });
  if (f.role === "civil" || f.role === "illegal") and.push({ role: f.role as Role });
  if (f.groupe === "none") and.push({ groupes: { none: {} } });
  else if (f.groupe) and.push({ groupes: { some: { groupeId: f.groupe } } });
  return and.length ? { AND: and } : {};
}

export const characterListInclude = {
  player: { select: { id: true, pseudo: true } },
  versions: { select: { id: true, color: true } },
  groupes: {
    orderBy: { ordre: "asc" },
    include: { groupe: { select: { nom: true } }, grade: { select: { nom: true } } },
  },
} satisfies Prisma.CharacterInclude;

export type CharacterListRow = Prisma.CharacterGetPayload<{ include: typeof characterListInclude }>;

/** « Sergent · SASP » pour la dernière appartenance, sinon le métier. */
export function currentJob(c: CharacterListRow): string | null {
  const last = c.groupes.at(-1);
  if (!last) return null;
  return last.grade ? `${last.grade.nom} · ${last.groupe.nom}` : last.groupe.nom;
}
