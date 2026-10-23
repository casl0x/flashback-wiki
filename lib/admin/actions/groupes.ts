"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/admin/slug";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type GradeInput = { id: string | null; nom: string; niveau: string | null };

export type GroupeInput = {
  nom: string;
  slug: string;
  color: string | null;
  description: string | null;
  imageUrl: string | null;
  grades: GradeInput[]; // du plus haut au plus bas
};


export async function saveGroupe(id: string | null, input: GroupeInput): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const nom = input.nom.trim();
    const slug = slugify(input.slug || nom);
    if (!nom || !slug) return { ok: false, error: "Le nom et le slug sont requis." };
    const gradeNames = input.grades.map((g) => g.nom.trim().toLowerCase());
    if (gradeNames.some((n) => !n)) return { ok: false, error: "Chaque grade doit avoir un nom." };
    if (new Set(gradeNames).size !== gradeNames.length) return { ok: false, error: "Deux grades portent le même nom." };

    const data = {
      nom,
      slug,
      color: clean(input.color),
      description: clean(input.description),
      imageUrl: clean(input.imageUrl),
    };

    const saved = await prisma.$transaction(async (tx) => {
      const g = id ? await tx.groupe.update({ where: { id }, data }) : await tx.groupe.create({ data });

      const keep = input.grades.filter((x) => x.id).map((x) => x.id!);
      await tx.groupeGrade.deleteMany({ where: { groupeId: g.id, id: { notIn: keep } } });
      // Renommage en deux temps pour éviter les collisions de nom uniques.
      for (const gr of input.grades.filter((x) => x.id)) {
        await tx.groupeGrade.update({ where: { id: gr.id! }, data: { nom: `__tmp_${gr.id}` } });
      }
      for (const [i, gr] of input.grades.entries()) {
        const gradeData = { nom: gr.nom.trim(), niveau: clean(gr.niveau), ordre: i };
        if (gr.id) await tx.groupeGrade.update({ where: { id: gr.id }, data: gradeData });
        else await tx.groupeGrade.create({ data: { ...gradeData, groupeId: g.id } });
      }
      return g;
    }, { timeout: 20000 });

    await refreshAll();
    return { ok: true, data: { id: saved.id, slug: saved.slug } };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteGroupe(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.groupe.delete({ where: { id } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/**
 * Fusionne `sourceId` dans `targetId` : les membres passent dans le groupe cible
 * (grades repris par nom, créés si besoin), puis le groupe source est supprimé.
 */
export async function mergeGroupe(sourceId: string, targetId: string): Promise<ActionResult<{ moved: number }>> {
  try {
    await requireAdmin();
    if (sourceId === targetId) return { ok: false, error: "Choisis un autre groupe." };

    const moved = await prisma.$transaction(async (tx) => {
      const [srcGrades, tgtGrades] = await Promise.all([
        tx.groupeGrade.findMany({ where: { groupeId: sourceId } }),
        tx.groupeGrade.findMany({ where: { groupeId: targetId } }),
      ]);
      const gradeMap = new Map<string, string>();
      let nextOrdre = tgtGrades.length;
      for (const sg of srcGrades) {
        const match = tgtGrades.find((t) => t.nom.toLowerCase() === sg.nom.toLowerCase());
        const target =
          match ?? (await tx.groupeGrade.create({ data: { groupeId: targetId, nom: sg.nom, niveau: sg.niveau, ordre: nextOrdre++ } }));
        gradeMap.set(sg.id, target.id);
      }

      const members = await tx.characterGroupe.findMany({ where: { groupeId: sourceId } });
      let count = 0;
      for (const m of members) {
        const clash = await tx.characterGroupe.findFirst({
          where: { characterId: m.characterId, groupeId: targetId, versionId: m.versionId },
        });
        if (clash) {
          await tx.characterGroupe.delete({ where: { id: m.id } });
          continue;
        }
        await tx.characterGroupe.update({
          where: { id: m.id },
          data: { groupeId: targetId, gradeId: m.gradeId ? (gradeMap.get(m.gradeId) ?? null) : null },
        });
        count++;
      }
      await tx.groupe.delete({ where: { id: sourceId } });
      return count;
    }, { timeout: 30000 });

    await refreshAll();
    return { ok: true, data: { moved } };
  } catch (e) {
    return failure(e);
  }
}
