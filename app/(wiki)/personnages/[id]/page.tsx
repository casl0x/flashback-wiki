import CharacterDetailShell from "@/components/wiki/CharacterDetailShell";
import { getCharacterById, getCharactersByPlayerId } from "@/lib/wiki-data";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const character = await getCharacterById(id);

  if (!character) {
    notFound();
  }

  const samePlayerChars = character.player
    ? await getCharactersByPlayerId(character.player.id)
    : [];

  return (
    <CharacterDetailShell
      character={character}
      allCharacters={samePlayerChars}
    />
  );
}
