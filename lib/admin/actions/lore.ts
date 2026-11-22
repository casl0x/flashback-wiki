"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { parseClipInputs, type LoreClipInput } from "@/lib/lore";
import { revalidatePath } from "next/cache";
import { failure, refreshAll, type ActionResult } from "./shared";

export type LoreEventInput = {
  kind: "EVENT" | "TEXT";
  titre: string;
  /** Bloc TEXT : Markdown léger. */
  contenu: string;
  resume: string;
  versionId: string;
  major: boolean;
  clips: LoreClipInput[];
  characterIds: string[];
  groupeIds: string[];
};

const uniq = (ids: string[]) => [...new Set(ids.filter(Boolean))];

function validate(input: LoreEventInput): string | null {
  if (!input.titre.trim()) return "Le titre est requis.";
  if (input.kind === "TEXT") {
    if (!input.contenu.trim()) return "Le texte est requis.";
  } else if (!input.resume.trim()) {
    return "Le résumé est requis.";
  }
  if (!input.versionId) return "Choisis une version.";
  for (const c of input.clips) {
    try {
      const u = new URL(c.url.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return `Lien de clip invalide : ${c.url}`;
    }
  }
  return null;
}

const after = async () => {
  await refreshAll();
  revalidatePath("/explorer/lore");
};

/** Crée (originalId null) ou modifie un événement. Un nouvel événement va en fin de sa version. */
export async function saveLoreEvent(
  originalId: string | null,
  input: LoreEventInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("lore");
    const error = validate(input);
    if (error) return { ok: false, error };

    // Un bloc de texte n'a ni résumé, ni clips, ni liens : seul son texte compte.
    const isText = input.kind === "TEXT";
    const clips = isText ? [] : parseClipInputs(input.clips);
    const characterIds = isText ? [] : uniq(input.characterIds);
    const groupeIds = isText ? [] : uniq(input.groupeIds);
    const base = {
      kind: input.kind,
      titre: input.titre.trim(),
      resume: isText ? "" : input.resume.trim(),
      contenu: isText ? input.contenu.trim() : null,
      major: isText ? false : input.major,
      clips,
      versionId: input.versionId,
    };
    const links = {
      characters: { create: characterIds.map((characterId) => ({ characterId })) },
      groupes: { create: groupeIds.map((groupeId) => ({ groupeId })) },
    };

    const id = await prisma.$transaction(async (tx) => {
      if (!originalId) {
        const max = await tx.loreEvent.aggregate({
          where: { versionId: input.versionId },
          _max: { ordre: true },
        });
        const e = await tx.loreEvent.create({
          data: { ...base, ordre: (max._max.ordre ?? -1) + 1, ...links },
          select: { id: true },
        });
        return e.id;
      }
      const previous = await tx.loreEvent.findUnique({
        where: { id: originalId },
        select: { versionId: true },
      });
      if (!previous) throw new Error("Événement introuvable.");
      // Changement de version : l'événement passe en fin de la nouvelle version.
      let ordre: number | undefined;
      if (previous.versionId !== input.versionId) {
        const max = await tx.loreEvent.aggregate({
          where: { versionId: input.versionId },
          _max: { ordre: true },
        });
        ordre = (max._max.ordre ?? -1) + 1;
      }
      await tx.loreEventCharacter.deleteMany({ where: { loreEventId: originalId } });
      await tx.loreEventGroupe.deleteMany({ where: { loreEventId: originalId } });
      await tx.loreEvent.update({
        where: { id: originalId },
        data: { ...base, ...(ordre === undefined ? {} : { ordre }), ...links },
      });
      return originalId;
    });

    await after();
    return { ok: true, data: { id } };
  } catch (e) {
    return failure(e);
  }
}

/** Nouvel ordre (du plus ancien au plus récent) des événements d'une version. */
export async function reorderLoreEvents(versionId: string, ids: string[]): Promise<ActionResult> {
  try {
    await requireAdmin("lore");
    await prisma.$transaction(
      ids.map((id, i) => prisma.loreEvent.updateMany({ where: { id, versionId }, data: { ordre: i } })),
    );
    await after();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteLoreEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("lore");
    await prisma.loreEvent.delete({ where: { id } });
    await after();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
