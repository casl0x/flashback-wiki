import { prisma } from "@/lib/db";
import { ACTEUR_LABEL } from "@/lib/relation-kinds";

/**
 * Regroupe les fiches reliées par une relation « Autre acteur » (transitif :
 * A–B et B–C donnent {A, B, C}). Renvoie, pour chaque fiche d'un groupe de
 * 2+ fiches, la liste des ids du groupe. Les fiches seules n'y figurent pas.
 */
export async function loadActeurGroups(): Promise<Map<string, string[]>> {
  const links = await prisma.relation.findMany({
    where: {
      OR: [
        { typeRelation: ACTEUR_LABEL },
        { typeRelationInverse: ACTEUR_LABEL },
      ],
    },
    select: { personnageAId: true, personnageBId: true },
  });

  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    parent.set(x, root);
    return root;
  };
  for (const l of links) {
    for (const id of [l.personnageAId, l.personnageBId]) {
      if (!parent.has(id)) parent.set(id, id);
    }
    parent.set(find(l.personnageAId), find(l.personnageBId));
  }

  const byRoot = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const root = find(id);
    byRoot.set(root, [...(byRoot.get(root) ?? []), id]);
  }

  const out = new Map<string, string[]>();
  for (const ids of byRoot.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) out.set(id, ids);
  }
  return out;
}
