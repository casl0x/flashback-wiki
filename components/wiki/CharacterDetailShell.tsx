"use client";

import { useRouter } from "next/navigation";
import CharacterDetail from "@/components/wiki/CharacterDetail";
import { Character } from "@/lib/db";

type Props = {
  character: Character;
  allCharacters: Character[];
};

export default function CharacterDetailShell({
  character,
  allCharacters,
}: Props) {
  const router = useRouter();

  return (
    <CharacterDetail
      character={character}
      allCharacters={allCharacters}
      onBack={() => router.push("/personnages")}
      onNavigate={(nextCharacter) => router.push(`/personnages/${nextCharacter.id}`)}
    />
  );
}