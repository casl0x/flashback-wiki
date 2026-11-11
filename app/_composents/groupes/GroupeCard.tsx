import { textOn } from "@/app/_composents/characters/CharacterHero";
import { cloudinaryUrl } from "@/lib/cloudinary";
import type { Groupe } from "@/lib/db";
import { anton } from "@/lib/fonts";
import {
  GROUPE_STATUT_LABEL,
  GROUPE_TYPE_META,
  groupeHref,
} from "@/lib/groupe-types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

/** Carte d'un groupe (groupe, entreprise ou service public) : mène à sa page / son trombinoscope. */
export default function GroupeCard({ groupe }: { groupe: Groupe }) {
  const accent = groupe.color ?? "#2F6FEB";
  const members = groupe.membersCount ?? 0;

  return (
    <Link
      href={groupeHref(groupe)}
      className="group flex min-h-24 items-center gap-3.5 rounded-xl border border-l-4 border-border bg-card p-3.5 transition-colors hover:bg-muted"
      style={{ borderLeftColor: accent }}
    >
      <span
        className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-xl"
        style={{ background: accent, color: textOn(accent) }}
      >
        {groupe.imageUrl ? (
          <Image
            src={cloudinaryUrl(
              groupe.imageUrl,
              "w_120,h_120,c_pad,b_transparent",
            )}
            alt=""
            fill
            unoptimized
            sizes="56px"
            className="object-contain p-1.5"
          />
        ) : (
          <span className={cn(anton.className, "text-[20px] opacity-80")}>
            {groupe.nom.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[16px] font-bold leading-tight group-hover:underline">
          {groupe.nom}
        </span>
        <span className="text-[13px] text-text-secondary">
          {GROUPE_TYPE_META[groupe.type].label} · {members} membre
          {members > 1 ? "s" : ""}
        </span>
        {(groupe.statut || groupe.dissous) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {groupe.statut && (
              <span className="rounded border border-border px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                {GROUPE_STATUT_LABEL[groupe.statut]}
              </span>
            )}
            {groupe.dissous && (
              <span className="rounded bg-muted px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-text-faint">
                Dissous
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}
