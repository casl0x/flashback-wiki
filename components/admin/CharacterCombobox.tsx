"use client";

import { Character } from "@/lib/db";
import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";

type Props = {
  characters: Character[];
  value: string;
  onValueChange: (value: string) => void;
  excludeId?: string;
};

export function CharacterCombobox({
  characters,
  value,
  onValueChange,
  excludeId,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = characters
    .filter((c) => c.nom !== excludeId)
    .filter(
      (c) =>
        c.nom.toLowerCase().includes(search.toLowerCase()) ||
        c.player?.pseudo?.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <Combobox
      items={filtered}
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
    >
      <ComboboxInput
        placeholder="Rechercher…"
        onChange={(e) => setSearch(e.target.value)}
      />
      <ComboboxContent>
        <ComboboxEmpty>Aucun personnage trouvé.</ComboboxEmpty>
        <ComboboxList>
          {(c) => (
            <ComboboxItem key={c.id} value={c.id}>
              {c.nom}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
