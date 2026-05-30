import CharacterDetailShell from "@/components/wiki/CharacterDetailShell";
import { getWikiData } from "@/lib/wiki-data";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const { characters } = await getWikiData();

  const character = characters.find((entry) => entry.id === id);

  if (!character) {
    notFound();
  }

  return (
    <CharacterDetailShell character={character} allCharacters={characters} />
  );
}
