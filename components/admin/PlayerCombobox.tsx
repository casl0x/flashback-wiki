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

  async function createPlayer() {
    setCreating(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: search.trim(), reseaux: {} }),
      });
      const newPlayer: Player = await res.json();
      console.log("status", res.status, "newPlayer", newPlayer);
      onValueChange(newPlayer.id, newPlayer);
      setSearch(newPlayer.pseudo);
    } catch (err) {
      console.error("Erreur création joueur", err);
    } finally {
      setCreating(false);
    }
  }

  const selectedPseudo = players.find((p) => p.id === value)?.pseudo ?? "";

  return (
    <Combobox items={players}>
      <ComboboxInput
        placeholder="Rechercher…"
        value={search || selectedPseudo}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ComboboxContent>
        {filtered.length === 0 && !canCreate && (
          <ComboboxEmpty>Aucun joueur trouvé.</ComboboxEmpty>
        )}
        <ComboboxList>
          {filtered.map((p) => (
            <ComboboxItem
              key={p.id}
              value={p.pseudo}
              onSelect={() => {
                onValueChange(p.id);
                setSearch(p.pseudo);
              }}
            >
              {p.pseudo}
              {p.id === value && (
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

          {canCreate && (
            <button
              type="button"
              onClick={createPlayer}
              disabled={creating}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-[12px] text-(--accent-light) border-t border-(--border) hover:bg-(--elevated) transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {creating ? "Création…" : `Créer "@${search.trim()}"`}
            </button>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
