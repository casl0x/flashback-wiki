import { displayNames } from "@/lib/admin/moderation";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import PlayerEditor from "./PlayerEditor";

export const dynamic = "force-dynamic";

const reseaux = (v: Prisma.JsonValue): Record<string, string> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string"))
    : {};

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew
    ? null
    : await prisma.player.findUnique({
        where: { id },
        include: {
          userProfile: { select: { clerkUserId: true, pseudo: true, updatedAt: true } },
          characters: {
            orderBy: { nom: "asc" },
            include: {
              versions: { select: { id: true, color: true } },
              groupes: { orderBy: { ordre: "asc" }, include: { groupe: { select: { nom: true } }, grade: { select: { nom: true } } } },
            },
          },
        },
      });
  if (!isNew && !p) notFound();

  const accountName = p?.userProfile
    ? (p.userProfile.pseudo ?? (await displayNames([p.userProfile.clerkUserId])).get(p.userProfile.clerkUserId) ?? "Utilisateur")
    : null;

  return (
    <PlayerEditor
      key={p?.id ?? "new"}
      initial={{
        id: p?.id ?? null,
        pseudo: p?.pseudo ?? "",
        badges: p?.badges ?? [],
        lienChaine: p?.lienChaine ?? "",
        reseaux: p ? reseaux(p.reseaux) : {},
      }}
      account={accountName}
      characters={(p?.characters ?? []).map((c) => {
        const last = c.groupes.at(-1);
        return {
          id: c.id,
          nom: c.nom,
          imageUrl: c.imageUrl,
          etatVie: c.etatVie,
          versions: c.versions,
          job: last ? [last.grade?.nom, last.groupe.nom].filter(Boolean).join(" · ") : c.metier,
        };
      })}
    />
  );
}
