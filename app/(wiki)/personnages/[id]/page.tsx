import CharacterPage from "@/app/_composents/characters/CharacterPage";
import { cloudinaryUrl, getCharacterPage } from "@/lib/character-page";
import { prisma } from "@/lib/db";
import { isAdminUser } from "@/lib/admin/auth";
import { isHiddenCharacter } from "@/lib/hidden-characters";
import { splitDescription, stripFormatting, stripMentions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCharacterPage(id);
  if (!c || isHiddenCharacter(id)) return { title: "Personnage introuvable – Flashback Wiki", robots: { index: false } };
  const title = `${c.nom} – Flashback Wiki`;
  const description =
    splitDescription(c.description).histoire.trim() && stripFormatting(stripMentions(splitDescription(c.description).histoire)).replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Fiche du personnage ${c.nom} sur Flashback Wiki : parcours, relations et joueur.`;
  const image = c.imageUrl ? cloudinaryUrl(c.imageUrl, "c_fill,w_1200,h_630,q_auto,f_jpg") : undefined;
  return {
    title,
    description,
    openGraph: { type: "profile", title, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const character = await getCharacterPage(id);
  if (!character) notFound();

  // Calculé hors du cache partagé (getCharacterPage) : c'est propre à ce
  // visiteur, pas à la fiche.
  const { userId } = await auth();
  // Perso masqué (HIDDEN_CHARACTER_IDS) : 404 pour tout le monde sauf les admins.
  if (isHiddenCharacter(id) && !(userId && (await isAdminUser(userId)))) notFound();
  let isOwner = false;
  if (userId && character.player) {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      select: { playerId: true },
    });
    isOwner = profile?.playerId === character.player.id;
  }

  return <CharacterPage c={character} isOwner={isOwner} />;
}
