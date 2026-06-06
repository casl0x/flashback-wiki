import { getWikiData } from "@/lib/wiki-data";
import CharactersClient from "./CharactersClient";

export const revalidate = 300;

export default async function CharactersPage() {
  const { characters } = await getWikiData();

  return <CharactersClient characters={characters} />;
}
