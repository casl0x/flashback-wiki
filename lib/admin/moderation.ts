import "server-only";

import { prisma } from "@/lib/db";
import { stripMentions } from "@/lib/utils";
import { clerkClient } from "@clerk/nextjs/server";

export type ModTab = "propositions" | "creations" | "createurs" | "liens";

export const MOD_TABS: { key: ModTab; label: string }[] = [
  { key: "propositions", label: "Propositions" },
  { key: "creations", label: "Créations" },
  { key: "createurs", label: "Créateurs" },
  { key: "liens", label: "Liens joueur" },
];

export async function countPending() {
  const [propositions, creations, createurs, liens] = await Promise.all([
    prisma.suggestion.count({ where: { status: "pending" } }),
    prisma.creatorPost.count({ where: { status: "pending" } }),
    prisma.creatorRole.count({ where: { status: "pending" } }),
    prisma.playerLinkRequest.count({ where: { status: "pending" } }),
  ]);
  return { propositions, creations, createurs, liens, total: propositions + creations + createurs + liens };
}

/** Nom affichable d'un compte : pseudo du profil, sinon nom Clerk. */
export async function displayNames(clerkIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = [...new Set(clerkIds.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!ids.length) return map;

  const profiles = await prisma.userProfile.findMany({
    where: { clerkUserId: { in: ids } },
    select: { clerkUserId: true, pseudo: true },
  });
  for (const p of profiles) if (p.pseudo) map.set(p.clerkUserId, p.pseudo);

  const missing = ids.filter((id) => !map.has(id));
  if (missing.length) {
    try {
      const client = await clerkClient();
      const { data } = await client.users.getUserList({ userId: missing.slice(0, 100), limit: 100 });
      for (const u of data) map.set(u.id, u.username ?? u.firstName ?? "Utilisateur");
    } catch {
      // Clerk indisponible : on affiche « Utilisateur ».
    }
  }
  return map;
}

export type QueueItem = {
  id: string;
  tab: ModTab;
  kind: string; // libellé court : MODIFICATION, NOUVEAU PERSO, ARTISTE · POST…
  color: string;
  title: string;
  author: string;
  createdAt: string;
};

const COLORS = { edit: "#F6B26B", add: "#8AB4FF", art: "#E5A3F0", link: "#6EE7A0" };

export async function loadQueue(tab: ModTab, take = 50): Promise<QueueItem[]> {
  if (tab === "propositions") {
    const rows = await prisma.suggestion.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take,
      include: { character: { select: { nom: true } } },
    });
    const names = await displayNames(rows.map((r) => r.clerkUserId));
    return rows.map((r) => ({
      id: r.id,
      tab,
      kind: r.characterId ? "MODIFICATION" : "NOUVEAU PERSO",
      color: r.characterId ? COLORS.edit : COLORS.add,
      title: r.character?.nom ?? r.nom ?? "Sans nom",
      author: (r.clerkUserId && names.get(r.clerkUserId)) || "Utilisateur",
      createdAt: r.createdAt.toISOString(),
    }));
  }

  if (tab === "creations") {
    const rows = await prisma.creatorPost.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take,
      include: {
        creatorRole: { include: { userProfile: { select: { clerkUserId: true } } } },
        characters: { include: { character: { select: { nom: true } } } },
      },
    });
    const names = await displayNames(rows.map((r) => r.creatorRole.userProfile.clerkUserId));
    return rows.map((r) => ({
      id: r.id,
      tab,
      kind: `${r.type === "ARTISTE" ? "ARTISTE" : "ÉDITEUR"} · POST`,
      color: COLORS.art,
      title: r.characters.map((c) => c.character.nom).join(", ") || r.caption || "Création",
      author: names.get(r.creatorRole.userProfile.clerkUserId) ?? "Utilisateur",
      createdAt: r.createdAt.toISOString(),
    }));
  }

  if (tab === "createurs") {
    const rows = await prisma.creatorRole.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take,
      include: { userProfile: { select: { clerkUserId: true } } },
    });
    const names = await displayNames(rows.map((r) => r.userProfile.clerkUserId));
    return rows.map((r) => ({
      id: r.id,
      tab,
      kind: r.type === "ARTISTE" ? "DEMANDE ARTISTE" : "DEMANDE ÉDITEUR",
      color: COLORS.edit,
      title: names.get(r.userProfile.clerkUserId) ?? "Utilisateur",
      author: names.get(r.userProfile.clerkUserId) ?? "Utilisateur",
      createdAt: r.createdAt.toISOString(),
    }));
  }

  const rows = await prisma.playerLinkRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take,
    include: { player: { select: { pseudo: true } }, userProfile: { select: { clerkUserId: true } } },
  });
  const names = await displayNames(rows.map((r) => r.userProfile.clerkUserId));
  return rows.map((r) => {
    const who = names.get(r.userProfile.clerkUserId) ?? "Utilisateur";
    return {
      id: r.id,
      tab: "liens" as const,
      kind: "LIEN JOUEUR",
      color: COLORS.link,
      title: `${who} → ${r.player.pseudo}`,
      author: who,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

// ─── Détail d'une proposition : tableau avant / après ───────────────────────

export type DiffRow = { field: string; before: string; after: string };

const ETAT: Record<string, string> = {
  EN_VIE: "En vie",
  MORT: "Mort",
  PARTI: "Parti",
  DISPARU: "Disparu",
  PRISON: "En prison",
};
const ROLE: Record<string, string> = { civil: "Civil", illegal: "Illégal" };

export async function loadSuggestionDetail(id: string) {
  const s = await prisma.suggestion.findUnique({
    where: { id },
    include: {
      version: { select: { id: true, label: true } },
      character: {
        include: {
          player: { select: { pseudo: true } },
          versions: { select: { id: true } },
          groupes: { include: { groupe: { select: { nom: true } } } },
        },
      },
    },
  });
  if (!s) return null;
  const c = s.character;
  const author = s.clerkUserId ? (await displayNames([s.clerkUserId])).get(s.clerkUserId) : null;

  const rows: DiffRow[] = [];
  const push = (field: string, before: string | null | undefined, after: string | null | undefined) => {
    if (!after) return;
    if ((before ?? "") === after) return;
    rows.push({ field, before: before || "—", after });
  };
  push("Nom", c?.nom, s.nom);
  push("Joueur", c?.player?.pseudo, s.joueur);
  push("Version", c ? c.versions.map((v) => v.id).join(", ") : null, s.version ? `+ ${s.version.id}` : null);
  push("Groupe", c ? c.groupes.map((g) => g.groupe.nom).join(", ") : null, s.groupe ? `+ ${s.groupe}` : null);
  push("Rôle", c?.role ? ROLE[c.role] : null, s.role ? ROLE[s.role] : null);
  push("État", c ? ETAT[c.etatVie] : null, s.etatVie ? ETAT[s.etatVie] : null);
  push("Lien rediffusion", c?.lienReddif, s.lienReddif);
  push("Description", c?.description ? stripMentions(c.description) : null, s.description ? stripMentions(s.description) : null);

  return {
    id: s.id,
    isNew: !s.characterId,
    characterId: s.characterId,
    title: c?.nom ?? s.nom ?? "Sans nom",
    author: author ?? "Utilisateur",
    createdAt: s.createdAt.toISOString(),
    note: s.note,
    rows,
  };
}

export async function loadCreationDetail(id: string) {
  const p = await prisma.creatorPost.findUnique({
    where: { id },
    include: {
      creatorRole: { include: { userProfile: { select: { clerkUserId: true } } } },
      characters: { include: { character: { select: { id: true, nom: true } } } },
    },
  });
  if (!p) return null;
  const author = (await displayNames([p.creatorRole.userProfile.clerkUserId])).get(p.creatorRole.userProfile.clerkUserId);
  return {
    id: p.id,
    type: p.type,
    imageUrl: p.imageUrl,
    linkUrl: p.linkUrl,
    platform: p.platform,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
    author: author ?? "Utilisateur",
    characters: p.characters.map((c) => c.character),
  };
}

export async function loadCreatorRoleDetail(id: string) {
  const r = await prisma.creatorRole.findUnique({
    where: { id },
    include: { userProfile: { select: { clerkUserId: true, pseudo: true, bio: true } }, socialLinks: true },
  });
  if (!r) return null;
  const author = (await displayNames([r.userProfile.clerkUserId])).get(r.userProfile.clerkUserId);
  return {
    id: r.id,
    type: r.type,
    bio: r.userProfile.bio,
    createdAt: r.createdAt.toISOString(),
    author: author ?? "Utilisateur",
    links: r.socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
  };
}

export async function loadLinkRequestDetail(id: string) {
  const r = await prisma.playerLinkRequest.findUnique({
    where: { id },
    include: {
      player: { include: { userProfile: { select: { clerkUserId: true } }, _count: { select: { characters: true } } } },
      userProfile: { select: { clerkUserId: true } },
    },
  });
  if (!r) return null;
  const names = await displayNames([r.userProfile.clerkUserId, r.player.userProfile?.clerkUserId]);
  return {
    id: r.id,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    author: names.get(r.userProfile.clerkUserId) ?? "Utilisateur",
    player: { id: r.player.id, pseudo: r.player.pseudo, characters: r.player._count.characters },
    alreadyLinkedTo: r.player.userProfile ? names.get(r.player.userProfile.clerkUserId) ?? "un autre compte" : null,
  };
}
