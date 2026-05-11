"use client";

import { Character } from "@/lib/db";
import { statusBadgeClass, statusBorderClass } from "@/lib/utils";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type Props = { character: Character; onClick?: () => void };

function getAvatarColors(color: string) {
  return {
    bg: `${color}18`,
    fg: color,
    bd: `${color}40`,
  };
}

export default function CharacterCard({ character, onClick }: Props) {
  const { bg, fg, bd } = getAvatarColors(character.version?.color ?? "#8880a8");

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer border-t-2 ${statusBorderClass(character.role)} hover:bg-(--card-hover) transition-colors`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-[13px] font-semibold text-(--text-primary)">
              {character.nom}
            </CardTitle>
            <CardDescription className="truncate text-[11px] text-(--text-secondary)">
              {character.metier && <span>Métier : {character.metier}</span>}
              {character.groupe && <span>Groupe : {character.groupe}</span>}
            </CardDescription>
          </div>
          {character.versionId && (
            <Badge
              className="text-[9px] uppercase tracking-wide"
              variant="outline"
              style={{ color: fg, borderColor: bd, background: bg }}
            >
              {character.versionId}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-6 flex items-center justify-between">
        <span className="text-[10px] text-(--text-muted)">
          {character.player?.pseudo}
        </span>
        {character.role && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${statusBadgeClass(character.role)}`}
          >
            {character.role === "civil" ? "Civil" : "Illégal"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
