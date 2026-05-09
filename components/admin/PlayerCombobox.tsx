"use client";

import { Player } from "@/lib/db";
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
  players: Player[];
  value: string;
  onValueChange: (value: string) => void;
};

export function PlayerCombobox({ players, value, onValueChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) =>
    p.pseudo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Combobox items={players}>
      <ComboboxInput
        placeholder="Rechercher…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ComboboxContent>
        <ComboboxEmpty>Aucun joueur trouvé.</ComboboxEmpty>
        <ComboboxList>
          {filtered.map((p) => (
            <ComboboxItem
              key={p.id}
              value={p.pseudo}
              onSelect={() => onValueChange(String(p.id))}
            >
              {p.pseudo}
              {String(p.id) === value && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="ml-auto text-(--accent-light)"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
