"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { GROUPE_TYPES, type GroupeType } from "@/lib/groupe-types";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type GradeModeleInput = {
  id: string | null;
  nom: string;
  type: GroupeType | null; // null = proposé pour tous les types
  grades: { nom: string; color: string | null }[]; // du plus haut au plus bas
};

/** Remplace la liste des modèles de grades (ordre de la liste = ordre d'affichage). */
export async function saveGradeModeles(list: GradeModeleInput[]): Promise<ActionResult> {
  try {
    await requireAdmin("grade-modeles");

    const names = list.map((m) => m.nom.trim().toLowerCase());
    if (names.some((n) => !n)) return { ok: false, error: "Chaque modèle doit avoir un nom." };
    if (new Set(names).size !== names.length) return { ok: false, error: "Deux modèles portent le même nom." };
    for (const m of list) {
      if (m.type && !GROUPE_TYPES.includes(m.type)) return { ok: false, error: "Type inconnu." };
      const gradeNames = m.grades.map((g) => g.nom.trim().toLowerCase());
      if (gradeNames.some((n) => !n)) return { ok: false, error: `Chaque grade de « ${m.nom} » doit avoir un nom.` };
      if (new Set(gradeNames).size !== gradeNames.length) {
        return { ok: false, error: `Deux grades de « ${m.nom} » portent le même nom.` };
      }
    }

    await prisma.$transaction(
      async (tx) => {
        const keep = list.filter((m) => m.id).map((m) => m.id!);
        await tx.gradeModele.deleteMany({ where: { id: { notIn: keep } } });
        // Renommage en deux temps pour éviter les collisions de nom uniques.
        for (const m of list.filter((x) => x.id)) {
          await tx.gradeModele.update({ where: { id: m.id! }, data: { nom: `__tmp_${m.id}` } });
        }
        for (const [i, m] of list.entries()) {
          const data = { nom: m.nom.trim(), type: m.type, ordre: i };
          const row = m.id
            ? await tx.gradeModele.update({ where: { id: m.id }, data })
            : await tx.gradeModele.create({ data });
          await tx.gradeModeleItem.deleteMany({ where: { modeleId: row.id } });
          if (m.grades.length) {
            await tx.gradeModeleItem.createMany({
              data: m.grades.map((g, j) => ({
                modeleId: row.id,
                nom: g.nom.trim(),
                color: clean(g.color),
                ordre: j,
              })),
            });
          }
        }
      },
      { timeout: 20000 },
    );

    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
