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
  onValueChange: (value: string, newPlayer?: Player) => void;
};

export function PlayerCombobox({ players, value, onValueChange }: Props) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = players.filter((p) =>
    p.pseudo.toLowerCase().includes(search.toLowerCase()),
  );
  const exactMatch = players.some(
    (p) => p.pseudo.toLowerCase() === search.toLowerCase(),
  );
  const canCreate = search.trim().length > 0 && !exactMatch;

  const createPlayer = async () => {
    setCreating(true);
    try {
      const pseudo = search.trim();
      // Minimal local creation: generate an id from the pseudo.
      const newPlayer: Player = { id: `new:${pseudo}`, pseudo } as Player;
      // Simulate async operation if needed
      await Promise.resolve();
      onValueChange(newPlayer.id, newPlayer);
      setSearch("");
    } finally {
      setCreating(false);
    }
  };

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
        {filtered.length === 0 && !canCreate && (
          <ComboboxEmpty>Aucun joueur trouvé.</ComboboxEmpty>
        )}
        <ComboboxList>
          {filtered.map((p) => (
            <ComboboxItem key={p.id} value={p.id}>
              {p.pseudo}
            </ComboboxItem>
          ))}
        </ComboboxList>
        {canCreate && (
          <button type="button" onClick={createPlayer} disabled={creating}>
            {creating ? "Création…" : `Créer "@${search.trim()}"`}
          </button>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
