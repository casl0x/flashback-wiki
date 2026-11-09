import "server-only";

import { invalidateWikiCache } from "@/lib/actions";
import { computeBadges } from "@/lib/badge-thresholds";
import { logChange } from "@/lib/changelog";
import { parseRediffusions, prisma } from "@/lib/db";
import { notifyBadgesEarned } from "@/lib/notifications";
import type { Prisma, Suggestion } from "@prisma/client";

/**
 * Applique une proposition acceptée sur le perso visé (ou en crée un),
 * puis crédite son auteur. Adapté au schéma de la refonte :
 * la version est ajoutée aux versions du perso, le groupe devient une
 * nouvelle appartenance pour cette version.
 * Renvoie l'id du perso touché (ou null).
 */
export async function applyAcceptedSuggestion(s: Suggestion): Promise<string | null> {
  const [groupe, joueur] = await Promise.all([
    s.groupe
      ? prisma.groupe.findFirst({ where: { nom: { equals: s.groupe.trim(), mode: "insensitive" } } })
      : null,
    s.joueur
      ? prisma.player.findFirst({ where: { pseudo: { equals: s.joueur.trim(), mode: "insensitive" } } })
      : null,
  ]);

  const fields = {
    ...(s.description ? { description: s.description } : {}),
    ...(s.role ? { role: s.role } : {}),
    ...(s.etatVie ? { etatVie: s.etatVie } : {}),
    ...(joueur ? { playerId: joueur.id } : {}),
    ...(s.versionId ? { versions: { connect: { id: s.versionId } } } : {}),
  };

  let characterId: string | null = null;

  // Un lien de rediffusion proposé s'ajoute à la liste existante du perso,
  // il ne la remplace pas (le champ est un Json, pas un tableau scalaire :
  // on ne peut pas faire un simple `push`, on relit puis on réécrit tout).
  if (s.characterId) {
    let lienReddifsUpdate: Prisma.InputJsonValue | undefined;
    if (s.lienReddif) {
      const current = await prisma.character.findUnique({
        where: { id: s.characterId },
        select: { lienReddifs: true },
      });
      lienReddifsUpdate = [
        ...parseRediffusions(current?.lienReddifs),
        { url: s.lienReddif, titre: null },
      ] as Prisma.InputJsonValue;
    }
    const c = await prisma.character.update({
      where: { id: s.characterId },
      data: {
        ...(s.nom ? { nom: s.nom } : {}),
        ...fields,
        ...(lienReddifsUpdate ? { lienReddifs: lienReddifsUpdate } : {}),
      },
    });
    characterId = c.id;
    await logChange("edit_info", c.nom);
  } else if (s.nom) {
    const c = await prisma.character.create({
      data: {
        nom: s.nom,
        ...fields,
        ...(s.lienReddif
          ? { lienReddifs: [{ url: s.lienReddif, titre: null }] as Prisma.InputJsonValue }
          : {}),
      },
    });
    characterId = c.id;
    await prisma.suggestion.update({ where: { id: s.id }, data: { characterId: c.id } });
    await logChange("add_global", c.nom, s.versionId ?? undefined);
  }

  if (characterId && groupe) {
    const exists = await prisma.characterGroupe.findFirst({
      where: { characterId, groupeId: groupe.id, versionId: s.versionId ?? null },
    });
    if (!exists) {
      const last = await prisma.characterGroupe.aggregate({
        where: { characterId },
        _max: { ordre: true },
      });
      await prisma.characterGroupe.create({
        data: {
          characterId,
          groupeId: groupe.id,
          versionId: s.versionId ?? null,
          ordre: (last._max.ordre ?? -1) + 1,
        },
      });
    }
  }

  if (s.clerkUserId) {
    const before = await prisma.userProfile.findUnique({
      where: { clerkUserId: s.clerkUserId },
      select: { badges: true },
    });
    const updated = await prisma.userProfile.upsert({
      where: { clerkUserId: s.clerkUserId },
      create: { clerkUserId: s.clerkUserId, totalPoints: 10, acceptedCount: 1 },
      update: { totalPoints: { increment: 10 }, acceptedCount: { increment: 1 } },
    });
    const existing = before?.badges ?? [];
    const computed = computeBadges(updated.totalPoints);
    const merged = [...new Set([...existing, ...computed])];
    await prisma.userProfile.update({ where: { clerkUserId: s.clerkUserId }, data: { badges: merged } });
    const earned = computed.filter((b) => !existing.includes(b));
    if (earned.length) await notifyBadgesEarned(s.clerkUserId, earned);
  }

  if (characterId) await invalidateWikiCache();
  return characterId;
}
