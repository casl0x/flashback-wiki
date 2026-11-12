"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { logChange } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { getTwitchAvatar } from "@/lib/twitch";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type PlayerInput = {
  pseudo: string;
  badges: string[];
  chaines: string[];
  reseaux: Record<string, string>;
  imageUrl: string | null;
};

export async function savePlayer(id: string | null, input: PlayerInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("players");
    const pseudo = input.pseudo.trim();
    if (!pseudo) return { ok: false, error: "Le pseudo est requis." };
    const reseaux = Object.fromEntries(
      Object.entries(input.reseaux)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v),
    );
    const badges = [...new Set(input.badges)];
    const chaines = input.chaines.map((c) => c.trim()).filter(Boolean);
    const data = {
      pseudo,
      badges,
      reseaux,
      chaines,
      imageUrl: clean(input.imageUrl),
      // Ancien champ : gardé synchronisé avec le badge « streamer ».
      stream: badges.includes("streamer"),
    };
    const p = id
      ? await prisma.player.update({ where: { id }, data })
      : await prisma.player.create({ data });
    await logChange(id ? "edit_player" : "add_player", p.pseudo);
    await refreshAll();
    return { ok: true, data: { id: p.id } };
  } catch (e) {
    return failure(e);
  }
}

/** Avatar Twitch d'un lien de chaîne, pour le bouton « Utiliser cette pp » de l'admin. */
export async function fetchTwitchAvatar(channelUrl: string): Promise<ActionResult<{ avatarUrl: string }>> {
  try {
    await requireAdmin("players");
    if (detectStreamPlatform(channelUrl) !== "twitch") {
      return { ok: false, error: "Ce n'est pas un lien Twitch." };
    }
    const login = extractStreamUsername(channelUrl);
    if (!login) return { ok: false, error: "Pseudo Twitch introuvable dans le lien." };
    const avatarUrl = await getTwitchAvatar(login);
    if (!avatarUrl) return { ok: false, error: "Avatar introuvable sur Twitch." };
    return { ok: true, data: { avatarUrl } };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("players");
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
    await requireAdmin("players");
    await prisma.userProfile.updateMany({ where: { playerId }, data: { playerId: null } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
