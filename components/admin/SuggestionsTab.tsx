"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  characterId: string;
  character: { nom: string };
  nom: string | null;
  metier: string | null;
  groupe: string | null;
  description: string | null;
  note: string | null;
  createdAt: string;
};

export function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch("/api/suggestions")
      .then((r) => r.json())
      .then(setSuggestions);
  }, []);

  async function updateStatus(id: string, status: "accepted" | "rejected") {
    await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setSuggestions((p) => p.filter((s) => s.id !== id));
  }

  if (!suggestions.length)
    return (
      <p className="text-[13px] text-text-muted py-4">
        Aucune proposition en attente.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-[12px] font-semibold text-text-primary">
                {s.character.nom}
              </p>
              {[
                { label: "Nom", value: s.nom },
                { label: "Métier", value: s.metier },
                { label: "Groupe", value: s.groupe },
                { label: "Description", value: s.description },
                { label: "Note", value: s.note },
              ]
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <p key={label} className="text-[11px] text-text-secondary">
                    <span className="text-text-muted">{label} :</span> {value}
                  </p>
                ))}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => updateStatus(s.id, "accepted")}
                className="text-[11px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
              >
                Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(s.id, "rejected")}
                className="text-[11px] border-border-mid text-text-muted cursor-pointer"
              >
                Refuser
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
