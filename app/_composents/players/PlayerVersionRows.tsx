import { ETAT_BADGE } from "@/app/_composents/characters/CharacterHero";
import SectionTitle from "@/app/_composents/characters/SectionTitle";
import { anton } from "@/lib/fonts";
import { cloudinaryUrl, type PlayerVersionRow } from "@/lib/player-page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function PlayerVersionRows({ rows }: { rows: PlayerVersionRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="persos-h" className="flex flex-col gap-6">
      <SectionTitle id="persos-h">Ses personnages, version par version</SectionTitle>
      {rows.map((row) => (
        <div key={row.key} className="flex flex-wrap items-start gap-4">
          <div
            className="flex flex-[0_0_120px] flex-col border-l-4 py-1 pl-3"
            style={{ borderLeftColor: row.version?.color ?? "#6E7380" }}
          >
            <span
              className={cn(anton.className, "text-[36px] leading-none")}
              style={{ color: row.version?.color ?? "#9AA0AA" }}
            >
              {row.version?.id ?? "—"}
            </span>
            <span className="text-[12px] text-[#9AA0AA]">
              {row.characters.length} perso{row.characters.length > 1 ? "s" : ""}
            </span>
            {!row.version && (
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#6E7380]">
                Sans version
              </span>
            )}
          </div>

          <div className="grid min-w-0 flex-[999_1_400px] grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {row.characters.map((c) => {
              const dead = c.etatVie === "MORT";
              const etat = c.etatVie !== "EN_VIE" ? ETAT_BADGE[c.etatVie] : null;
              return (
                <Link
                  key={c.id}
                  href={`/personnages/${c.id}`}
                  className="relative flex h-50 flex-col justify-end overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]"
                >
                  {c.imageUrl && (
                    <Image
                      src={cloudinaryUrl(c.imageUrl, "w_400,h_500,c_fill,g_face")}
                      alt=""
                      fill
                      unoptimized
                      sizes="200px"
                      className={cn("object-cover", dead && "grayscale")}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-[#0E0F12] from-10% to-transparent" />
                  {etat && (
                    <span
                      className={cn(
                        "absolute right-2 top-2 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        etat.className,
                      )}
                    >
                      {etat.label}
                    </span>
                  )}
                  <div className="relative flex flex-col px-3 pb-3">
                    <span className="text-[16px] font-bold leading-tight text-[#ECECEE]">
                      {c.nom}
                    </span>
                    {c.subtitle && (
                      <span className="text-[13px] text-[#C4C7CF]">{c.subtitle}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
