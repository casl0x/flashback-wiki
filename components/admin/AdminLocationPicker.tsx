"use client";

import { Button } from "@/components/ui/button";
import type { GameMapProps } from "@/components/wiki/GameMap";
import dynamic from "next/dynamic";
import { useState } from "react";

const GameMap = dynamic<GameMapProps>(
  () => import("@/components/wiki/GameMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-100 bg-slate-900 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">
          Chargement de la carte...
        </span>
      </div>
    ),
  },
);

type AdminLocationPickerProps = {
  characterId: string;
  characterName: string;
  initialX?: number | null;
  initialY?: number | null;
  imageUrl?: string | null;
  onSave: (x: number, y: number) => Promise<void>;
  onClear: () => Promise<void>;
};

export default function AdminLocationPicker({
  characterId,
  characterName,
  initialX,
  initialY,
  imageUrl,
  onSave,
  onClear,
}: AdminLocationPickerProps) {
  // savedX/Y = coords confirmées en DB (initialisées depuis les props, puis gérées localement)
  const [savedX, setSavedX] = useState<number | null>(initialX ?? null);
  const [savedY, setSavedY] = useState<number | null>(initialY ?? null);
  // pendingX/Y = position cliquée pas encore enregistrée
  const [pendingX, setPendingX] = useState<number | null>(null);
  const [pendingY, setPendingY] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const displayX = pendingX ?? savedX;
  const displayY = pendingY ?? savedY;
  const hasPending = pendingX != null;
  const hasSaved = savedX != null;

  const handleMapClick = (x: number, y: number) => {
    setPendingX(x);
    setPendingY(y);
    setJustSaved(false);
  };

  const handleSave = async () => {
    if (pendingX == null || pendingY == null) return;
    setSaving(true);
    try {
      await onSave(pendingX, pendingY);
      // Mettre à jour le state local sans dépendre du reload parent
      setSavedX(pendingX);
      setSavedY(pendingY);
      setPendingX(null);
      setPendingY(null);
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await onClear();
      setSavedX(null);
      setSavedY(null);
      setPendingX(null);
      setPendingY(null);
      setJustSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const markers =
    displayX != null && displayY != null
      ? [
          {
            id: characterId,
            name: characterName,
            x: displayX,
            y: displayY,
            imageUrl,
          },
        ]
      : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Cliquez sur la carte pour placer la résidence de{" "}
          <span className="text-white font-medium">{characterName}</span>
        </p>
        {displayX != null && (
          <span className="text-xs text-slate-500 font-mono">
            x: {displayX} / y: {displayY}
          </span>
        )}
      </div>

      <GameMap
        markers={markers}
        height={400}
        interactive={true}
        onMapClick={handleMapClick}
        highlightId={characterId}
      />

      <div className="flex items-center gap-3">
        {hasPending && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer la position"}
          </Button>
        )}

        {justSaved && !hasPending && (
          <span className="text-sm text-green-400 flex items-center gap-1">
            ✓ Position enregistrée
          </span>
        )}

        {hasSaved && !hasPending && (
          <Button onClick={handleClear} disabled={saving} variant="destructive">
            Supprimer la localisation
          </Button>
        )}
      </div>
    </div>
  );
}
