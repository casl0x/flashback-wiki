"use client";

import dynamic from "next/dynamic";

// Leaflet ne tourne que dans le navigateur.
const CharacterMapWidget = dynamic(
  () => import("@/app/_composents/characters/CharacterMapWidget"),
  {
    ssr: false,
  },
);

type Props = {
  characterId: string;
  name: string;
  x: number;
  y: number;
  imageUrl: string | null;
  role: string | null;
  versionColor: string | null;
};

export default function CharacterMap(props: Props) {
  return (
    <section aria-labelledby="map-h" className="flex flex-col gap-3">
      <h2
        id="map-h"
        className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-[#A3A8B3]"
      >
        Sur la carte
      </h2>
      <div className="overflow-hidden rounded-[10px] border border-[#23262D]">
        <CharacterMapWidget {...props} height={180} />
      </div>
    </section>
  );
}
