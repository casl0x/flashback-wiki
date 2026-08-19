"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function ChangelogTab() {
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!label) return;
    setLoading(true);
    await fetch("/api/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, detail: detail || null }),
    });
    setLabel("");
    setDetail("");
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3 max-w-md">
      <h2 className="text-[15px] font-bold tracking-wide text-text-primary">
        Annonce site
      </h2>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest text-text-muted">
          Titre
        </label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nouvelle fonctionnalité, correction…"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest text-text-muted">
          Détail (optionnel)
        </label>
        <textarea
          className="h-20 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Description de la mise à jour…"
        />
      </div>
      <Button size="sm" onClick={submit} disabled={loading || !label}>
        {loading ? "…" : "Publier"}
      </Button>
    </div>
  );
}