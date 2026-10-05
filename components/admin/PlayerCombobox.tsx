"use client";

import { Player } from "@/lib/db";
import { matchesSearch, normalizeSearch } from "@/lib/utils";
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

  const filtered = players.filter((p) => matchesSearch(p.pseudo, search));
  const exactMatch = players.some(
    (p) => normalizeSearch(p.pseudo) === normalizeSearch(search),
  );
  const canCreate = search.trim().length > 0 && !exactMatch;

  const createPlayer = async () => {
    setCreating(true);
    try {
      const pseudo = search.trim();
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, lienChaine: null, reseaux: {} }),
      });

      if (!res.ok) throw new Error("Échec de la création");

      const newPlayer: Player = await res.json();
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
