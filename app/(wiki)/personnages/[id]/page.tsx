import CharacterPage from "@/app/_composents/characters/CharacterPage";
import { getCharacterPage } from "@/lib/character-page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCharacterPage(id);
  if (!c) return { title: "Personnage introuvable – Flashback Wiki" };
  return {
    title: `${c.nom} – Flashback Wiki`,
    description:
      c.description?.replace(/@\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 160) ??
      undefined,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const character = await getCharacterPage(id);
  if (!character) notFound();
  return <CharacterPage c={character} />;
}
