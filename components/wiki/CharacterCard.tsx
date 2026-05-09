"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      className={`cursor-pointer border-t-2 ${statusBorderClass(character.status)} hover:bg-[var(--card-hover)] transition-colors`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="rounded-[8px] size-9">
            <AvatarFallback
              className="rounded-[8px] text-[13px] font-bold border"
              style={{ background: bg, color: fg, borderColor: bd }}
            >
              {character.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              {character.name}
            </CardTitle>
            <CardDescription className="truncate text-[11px] text-[var(--text-secondary)]">
              {character.job}
            </CardDescription>
          </div>
          <Badge
            className="text-[9px] uppercase tracking-wide"
            variant="outline"
            style={{ color: fg, borderColor: bd, background: bg }}
          >
            {character.version_id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-6 flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">
          {(character.player as { pseudo?: string } | null)?.pseudo}
        </span>
        {character.status && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${statusBadgeClass(character.status)}`}
          >
            {character.status}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
