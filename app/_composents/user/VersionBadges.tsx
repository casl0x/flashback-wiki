import type { VersionBadge } from "@/lib/version-badges";
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

/** Pastille d'une version, à la couleur de la version. */
export function VersionPill({
  version,
  kind,
}: {
  version: VersionBadge;
  kind: "contributor" | "creator";
}) {
  const title =
    kind === "creator"
      ? `Créateur sur ${version.label}`
      : `Contributeur sur ${version.label}`;
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold",
      )}
      style={{
        color: version.color,
        background: `color-mix(in srgb, ${version.color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${version.color} 40%, transparent)`,
      }}
    >
      {kind === "creator" && <Palette className="h-3 w-3" aria-hidden />}
      {version.id}
    </span>
  );
}
