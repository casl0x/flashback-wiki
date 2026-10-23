"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { logChange } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type VersionInput = {
  id: string; // ex. « V7 » (modifiable seulement à la création)
  label: string;
  color: string;
  description: string | null;
  imageUrl: string | null;
  dateDebut: string | null; // AAAA-MM-JJ
  dateFin: string | null;
  enCours: boolean;
};

const toDate = (v: string | null) => (v ? new Date(`${v}T00:00:00Z`) : null);

export async function saveVersion(originalId: string | null, input: VersionInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const id = input.id.trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,12}$/.test(id)) return { ok: false, error: "Identifiant invalide (ex. V7)." };
    if (!input.label.trim()) return { ok: false, error: "Le nom affiché est requis." };
    if (!/^#[0-9a-f]{6}$/i.test(input.color)) return { ok: false, error: "Couleur au format #RRGGBB." };

    const data = {
      label: input.label.trim(),
      color: input.color,
      description: clean(input.description),
      imageUrl: clean(input.imageUrl),
      dateDebut: toDate(input.dateDebut),
      dateFin: input.enCours ? null : toDate(input.dateFin),
      enCours: input.enCours,
    };

    await prisma.$transaction(async (tx) => {
      // Une seule version « en cours » à la fois.
      if (input.enCours) await tx.version.updateMany({ where: { enCours: true, NOT: { id: originalId ?? id } }, data: { enCours: false } });
      if (originalId) {
        await tx.version.update({ where: { id: originalId }, data });
      } else {
        const max = await tx.version.aggregate({ _max: { ordre: true } });
        await tx.version.create({ data: { id, ...data, ordre: (max._max.ordre ?? -1) + 1 } });
      }
    });

    if (!originalId) await logChange("version", data.label);
    await refreshAll();
    return { ok: true, data: { id: originalId ?? id } };
  } catch (e) {
    return failure(e);
  }
}

/** Nouvel ordre des bandes de l'accueil. */
export async function reorderVersions(ids: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.$transaction(ids.map((id, i) => prisma.version.update({ where: { id }, data: { ordre: i } })));
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteVersion(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.version.delete({ where: { id } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
