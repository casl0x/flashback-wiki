"use client";

import { Character } from "@/lib/db";
import Image from "next/image";
import { LifeStateIcon } from "./LifeStateIcon";

type Props = {
  character: Character;
  onClick?: () => void;
  hidePlayer?: boolean;
  relationTag?: string;
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter((n) => n)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarStyle(color: string) {
  return {
    background: `${color}18`,
    color: `${color}CC`,
    borderColor: `${color}60`,
  };
}

function getContrastColor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "white";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "black" : "white";
}

export default function CharacterCard({ character, onClick }: Props) {
  const versions = character.versions?.length
    ? character.versions
    : character.version
      ? [character.version]
      : [];
  const versionColor = versions[0]?.color || "#64748b";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer relative flex flex-col rounded-md border justify-end overflow-hidden h-60"
    >
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-10">
        <div className="min-w-0 flex-1 flex flex-wrap gap-1">
          {versions.map((version) => {
            const color = version.color || "#64748b";

            return (
              <span
                key={version.id}
                className="shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: color,
                  color: getContrastColor(color),
                }}
              >
                {version.id}
              </span>
            );
          })}
        </div>
        {character.etatVie && character.etatVie !== "EN_VIE" && (
          <LifeStateIcon
            etat={character.etatVie as "MORT" | "PARTI" | "DISPARU" | "PRISON"}
          />
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
        {character.imageUrl ? (
          <Image
            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_480,c_fill,g_face,q_auto/${character.imageUrl}`}
            alt={`Character ${character.id}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 190px"
            className="object-cover"
            quality={100}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-semibold"
            style={getAvatarStyle(versionColor || "#64748b")}
          >
            {getInitials(character.nom)}
          </div>
        )}
      </div>
      <div
        className="relative z-10 flex flex-col w-full rounded-b-lg p-2 pt-4 text-base/4 font-sans"
        style={{
          color: "white",
          borderTop: `2px solid ${versionColor}`,
        }}
      >
        <p
          className="text-md uppercase mb-1.5 tracking-wide"
          title={character.nom}
        >
          {character.nom}
        </p>
        <span className="text-xs text-white/90">
          Jouer par {character.player?.pseudo ?? "Inconnu"}
        </span>
      </div>
    </div>
  );
}
