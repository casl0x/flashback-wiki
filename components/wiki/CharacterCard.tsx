"use client";

import { Character } from "@/lib/db";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

type Props = {
  character: Character;
  onClick?: () => void;
  hidePlayer?: boolean;
  relationTag?: string;
};

export function getInitials(name: string) {
  return name
    .split(" ")
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

export default function CharacterCard({
  character,
  onClick,
  hidePlayer,
  relationTag,
}: Props) {
  const color = character.version?.color ?? "#7F77DD";
  const avatarStyle = getAvatarStyle(color);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:bg-(--card-hover) transition-colors"
    >
      <CardHeader className="pb-0">
        <div className="flex items-start gap-3 flex-wrap">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full border-2 shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-medium"
            style={avatarStyle}
          >
            {character.imageUrl ? (
              <Image
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_44,h_44,c_fill,g_face/${character.imageUrl}`}
                width={44}
                height={44}
                className="w-full h-full object-cover"
                alt={character.nom}
                unoptimized
              />
            ) : (
              getInitials(character.nom)
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <p className="text-[14px] font-medium text-(--text-primary) truncate">
                {character.nom}
              </p>
              {/* Badge version ou tag de relation */}
              {relationTag ? (
                <Badge
                  className="text-[9px] shrink-0"
                  variant="outline"
                  style={{
                    color: "var(--accent-light)",
                    borderColor: "var(--border-accent)",
                    background: "var(--accent-bg)",
                  }}
                >
                  {relationTag}
                </Badge>
              ) : character.versionId ? (
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0"
                  style={{
                    color: `${color}CC`,
                    borderColor: `${color}40`,
                    background: `${color}18`,
                  }}
                >
                  {character.versionId}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-row gap-1 mt-1">
              {character.metier && (
                <p className="text-[12px] text-(--text-secondary) mb-1">
                  {character.metier}
                </p>
              )}
              {character.metier && character.groupes.length > 0 && (
                <span className="text-[10px] text-(--text-secondary) mx-1">
                  •
                </span>
              )}
              {character.groupes.length > 0 && (
                <p className="text-[12px] text-(--text-secondary) mb-1">
                  {character.groupes[0].nom}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Description */}
      {character.description && (
        <CardContent>
          <p className="text-[12px] text-(--text-secondary) leading-relaxed line-clamp-2">
            {character.description}
          </p>
        </CardContent>
      )}
      {!hidePlayer && character.player?.pseudo && (
        <CardFooter>
          <span className="flex items-end gap-1 text-[11px] text-(--text-secondary) pr-0.75">
            Joué par {character.player.pseudo}
          </span>

          {character.player.stream && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="#9146ff"
              aria-hidden="true"
            >
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
