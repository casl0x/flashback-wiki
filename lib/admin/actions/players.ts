"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type PlayerInput = {
  pseudo: string;
  badges: string[];
  lienChaine: string | null;
  reseaux: Record<string, string>;
};

export async function savePlayer(id: string | null, input: PlayerInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const pseudo = input.pseudo.trim();
    if (!pseudo) return { ok: false, error: "Le pseudo est requis." };
    const reseaux = Object.fromEntries(
      Object.entries(input.reseaux)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v),
    );
    const badges = [...new Set(input.badges)];
    const data = {
      pseudo,
      badges,
      reseaux,
      lienChaine: clean(input.lienChaine),
      // Ancien champ : gardé synchronisé avec le badge « streamer ».
      stream: badges.includes("streamer"),
    };
    const p = id
      ? await prisma.player.update({ where: { id }, data })
      : await prisma.player.create({ data });
    await refreshAll();
    return { ok: true, data: { id: p.id } };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    // Les persos du joueur restent, sans joueur (onDelete: SetNull).
    await prisma.player.delete({ where: { id } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function unlinkPlayerAccount(playerId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.userProfile.updateMany({ where: { playerId }, data: { playerId: null } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
