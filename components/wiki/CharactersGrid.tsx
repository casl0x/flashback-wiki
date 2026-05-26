"use client";

import { Character } from "@/lib/db";
import Link from "next/link";
import CharacterCard from "./CharacterCard";

type Props = { chars: Character[]; onSelect?: (c: Character) => void };

export default function CharactersGrid({ chars, onSelect }: Props) {
  if (onSelect) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chars.map((c) => (
          <CharacterCard key={c.id} character={c} onClick={() => onSelect(c)} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {chars.map((c) => (
        <Link key={c.id} href={`/personnages/${c.id}`} prefetch={true}>
          <CharacterCard character={c} />
        </Link>
      ))}
    </div>
  );
}
