"use client";

import type { MapMarker } from "@/components/wiki/GameMap";
import dynamic from "next/dynamic";

import type { GameMapProps } from "@/components/wiki/GameMap";
import { MapPin } from "lucide-react";

const GameMap = dynamic<GameMapProps>(
  () => import("@/components/wiki/GameMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-75 bg-slate-900 rounded-lg animate-pulse" />
    ),
  },
);

type CharacterMapWidgetProps = {
  characterId: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string | null;
  role?: string | null;
  versionColor?: string | null;
  height?: number;
};

export default function CharacterMapWidget({
  characterId,
  name,
  x,
  y,
  imageUrl,
  role,
  versionColor,
  height = 300,
}: CharacterMapWidgetProps) {
  const marker: MapMarker = {
    id: characterId,
    name,
    x,
    y,
    imageUrl,
    role,
    versionColor,
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/50">
      <GameMap
        markers={[marker]}
        height={height}
        interactive={false}
        highlightId={characterId}
      />
      <div className="px-2 py-1.5 bg-slate-800/60 border-t border-slate-700/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <MapPin size={14} /> Localisation
        </span>
      </div>
    </div>
  );
}
