"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { logChange } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { detectSoundPlatform } from "@/lib/media-embed";
import type { EtatVie, Role } from "@prisma/client";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

export type MembershipInput = {
  groupeId: string;
  versionId: string | null;
  gradeId: string | null;
  matricule: string | null;
};

export type SoundInput = { titre: string; artiste: string | null; url: string };

/** `type` = ce que l'autre perso est pour celui-ci ; `inverse` = l'inverse. */
export type RelationInput = { otherId: string; type: string | null; inverse: string | null };

export type CharacterInput = {
  nom: string;
  role: Role | null;
  metier: string | null;
  etatVie: EtatVie;
  description: string | null;
  lienReddif: string | null;
  imageUrl: string | null;
  playerId: string | null;
  versionIds: string[];
  memberships: MembershipInput[]; // dans l'ordre chronologique
  sounds: SoundInput[];
  relations: RelationInput[];
};

function validate(input: CharacterInput, selfId: string | null): string | null {
  if (!input.nom.trim()) return "Le nom est requis.";
  for (const m of input.memberships) {
    if (!m.groupeId) return "Chaque ligne de groupe doit avoir un groupe.";
  }
  for (const s of input.sounds) {
    if (!s.titre.trim() || !s.url.trim()) return "Chaque son doit avoir un titre et un lien.";
  }
  const others = new Set<string>();
  for (const r of input.relations) {
    if (!r.otherId) return "Chaque relation doit viser un perso.";
    if (r.otherId === selfId) return "Un perso ne peut pas être en relation avec lui-même.";
    if (others.has(r.otherId)) return "Le même perso est lié deux fois.";
    others.add(r.otherId);
  }
  return null;
}

export async function saveCharacter(
  id: string | null,
  input: CharacterInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const problem = validate(input, id);
    if (problem) return { ok: false, error: problem };

    const base = {
      nom: input.nom.trim(),
      role: input.role,
      metier: clean(input.metier),
      etatVie: input.etatVie,
      description: clean(input.description),
      lienReddif: clean(input.lienReddif),
      imageUrl: clean(input.imageUrl),
      playerId: input.playerId || null,
    };

    const savedId = await prisma.$transaction(async (tx) => {
      const c = id
        ? await tx.character.update({
            where: { id },
            data: { ...base, versions: { set: input.versionIds.map((v) => ({ id: v })) } },
          })
        : await tx.character.create({
            data: { ...base, versions: { connect: input.versionIds.map((v) => ({ id: v })) } },
          });

      // Groupes : on remplace tout, l'ordre de la liste fait foi.
      await tx.characterGroupe.deleteMany({ where: { characterId: c.id } });
      if (input.memberships.length) {
        await tx.characterGroupe.createMany({
          data: input.memberships.map((m, i) => ({
            characterId: c.id,
            groupeId: m.groupeId,
            versionId: m.versionId || null,
            gradeId: m.gradeId || null,
            matricule: clean(m.matricule),
            ordre: i,
          })),
        });
      }

      // Sons
      await tx.sound.deleteMany({ where: { characterId: c.id } });
      if (input.sounds.length) {
        await tx.sound.createMany({
          data: input.sounds.map((s, i) => ({
            characterId: c.id,
            titre: s.titre.trim(),
            artiste: clean(s.artiste),
            url: s.url.trim(),
            platform: detectSoundPlatform(s.url),
            ordre: i,
          })),
        });
      }

      // Relations : une ligne par paire (A < B). Dans la ligne, typeRelation décrit B pour A.
      const existing = await tx.relation.findMany({
        where: { OR: [{ personnageAId: c.id }, { personnageBId: c.id }] },
      });
      const wanted = new Set(input.relations.map((r) => r.otherId));
      const toDelete = existing.filter(
        (r) => !wanted.has(r.personnageAId === c.id ? r.personnageBId : r.personnageAId),
      );
      if (toDelete.length) await tx.relation.deleteMany({ where: { id: { in: toDelete.map((r) => r.id) } } });

      for (const r of input.relations) {
        const selfIsA = c.id < r.otherId;
        const [a, b] = selfIsA ? [c.id, r.otherId] : [r.otherId, c.id];
        const typeRelation = selfIsA ? clean(r.type) : clean(r.inverse);
        const typeRelationInverse = selfIsA ? clean(r.inverse) : clean(r.type);
        await tx.relation.upsert({
          where: { personnageAId_personnageBId: { personnageAId: a, personnageBId: b } },
          update: { typeRelation, typeRelationInverse },
          create: { personnageAId: a, personnageBId: b, typeRelation, typeRelationInverse },
        });
      }

      return c.id;
    }, { timeout: 20000 });

    await logChange(id ? "edit_info" : "add_global", base.nom, input.versionIds.at(-1));
    await refreshAll();
    return { ok: true, data: { id: savedId } };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteCharacter(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = await prisma.character.delete({ where: { id }, select: { nom: true } });
    await logChange("edit_info", c.nom, "Personnage supprimé");
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function saveCharacterLocation(id: string, x: number | null, y: number | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = await prisma.character.update({
      where: { id },
      data: { locationX: x, locationY: y },
      select: { nom: true },
    });
    await logChange(x == null ? "edit_lieu" : "add_lieu", c.nom);
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** Ajoute (ou retire) une version à plusieurs persos d'un coup. */
export async function bulkSetVersion(
  ids: string[],
  versionId: string,
  mode: "add" | "remove",
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();
    if (!ids.length || !versionId) return { ok: false, error: "Sélection vide." };
    await prisma.$transaction(
      ids.map((id) =>
        prisma.character.update({
          where: { id },
          data: { versions: mode === "add" ? { connect: { id: versionId } } : { disconnect: { id: versionId } } },
        }),
      ),
    );
    await refreshAll();
    return { ok: true, data: { count: ids.length } };
  } catch (e) {
    return failure(e);
  }
}

/**
 * Titre + artiste d'un son depuis son lien (oEmbed YouTube / SoundCloud / Spotify).
 * Ne lance pas d'erreur : renvoie ce qu'il a pu trouver.
 */
export async function fetchSoundMeta(url: string): Promise<{ titre: string | null; artiste: string | null }> {
  await requireAdmin();
  const platform = detectSoundPlatform(url);
  const endpoint =
    platform === "youtube"
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
      : platform === "soundcloud"
        ? `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
        : platform === "spotify"
          ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
          : null;
  if (!endpoint) return { titre: null, artiste: null };
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { titre: null, artiste: null };
    const json = (await res.json()) as { title?: string; author_name?: string };
    let titre = json.title ?? null;
    let artiste = json.author_name ?? null;
    // SoundCloud renvoie « Titre by Artiste ».
    if (platform === "soundcloud" && titre?.includes(" by ")) {
      const i = titre.lastIndexOf(" by ");
      artiste = artiste ?? titre.slice(i + 4);
      titre = titre.slice(0, i);
    }
    return { titre, artiste };
  } catch {
    return { titre: null, artiste: null };
  }
}
