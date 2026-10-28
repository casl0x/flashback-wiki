import { textOn } from "@/app/_composents/characters/CharacterHero";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { GROUPE_TYPE_META, groupeHref, type GroupeType } from "@/lib/groupe-types";
import { prisma } from "@/lib/db";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { versionRank } from "@/lib/version-rank";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";


// Couleur de repli si un grade (ancien format) n'a pas encore de couleur propre.
const FALLBACK_COLOR = "#9AA0AA";
const NONE = "__none__";

export const loadGroupe = unstable_cache(
  async (slug: string) =>
    prisma.groupe.findUnique({
      where: { slug },
      include: {
        grades: { orderBy: { ordre: "asc" } },
        members: {
          include: {
            version: { select: { id: true, label: true, color: true } },
            character: {
              select: {
                id: true,
                nom: true,
                imageUrl: true,
                etatVie: true,
                player: { select: { pseudo: true } },
              },
            },
          },
        },
      },
    }),
  ["groupe-page"],
  { revalidate: 300, tags: ["wiki-data"] },
);

export async function groupeMetadata(
  slug: string,
  type: GroupeType,
): Promise<Metadata> {
  const g = await loadGroupe(slug);
  return {
    title:
      g && g.type === type
        ? `${g.nom} – Flashback Wiki`
        : `${GROUPE_TYPE_META[type].label} introuvable – Flashback Wiki`,
  };
}

/** Page d'un groupe, d'une entreprise ou d'un service public (même rendu). */
export default async function GroupePage({
  slug,
  v,
  type,
}: {
  slug: string;
  v?: string;
  type: GroupeType;
}) {
  const g = await loadGroupe(slug);
  if (!g) notFound();
  // Une entreprise ouverte via /groupes/… (ou l'inverse) est redirigée vers sa vraie section.
  if (g.type !== type) {
    permanentRedirect(`${groupeHref(g)}${v ? `?v=${encodeURIComponent(v)}` : ""}`);
  }
  const meta = GROUPE_TYPE_META[g.type];

  const accent = g.color ?? "#2F6FEB";
  const onAccent = textOn(accent);

  // Périodes (versions) où le groupe a des membres, la plus récente d'abord.
  const periods = new Map<
    string,
    { id: string; label: string; color: string; members: typeof g.members }
  >();
  for (const m of g.members) {
    const key = m.version?.id ?? NONE;
    if (!periods.has(key)) {
      periods.set(key, {
        id: key,
        label: m.version?.id ?? "Sans version",
        color: m.version?.color ?? "#C4C7CF",
        members: [],
      });
    }
    periods.get(key)!.members.push(m);
  }
  const tabs = [...periods.values()].sort(
    (a, b) =>
      versionRank(b.id === NONE ? null : b.id) -
      versionRank(a.id === NONE ? null : a.id),
  );
  const current = tabs.find((t) => t.id === v) ?? tabs[0];
  const totalMembers = new Set(g.members.map((m) => m.characterId)).size;

  // Hiérarchie de la période : une rangée par grade (ordre défini dans l'admin), puis « Sans grade ».
  const ranks = current
    ? [
        ...g.grades.map((gr) => ({
          key: gr.id,
          label: gr.nom,
          color: gr.color || FALLBACK_COLOR,
          people: current.members.filter((m) => m.gradeId === gr.id),
        })),
        {
          key: NONE,
          label: g.grades.length ? "Sans grade" : "Membres",
          color: "#6E7380",
          people: current.members.filter(
            (m) => !m.gradeId || !g.grades.some((gr) => gr.id === m.gradeId),
          ),
        },
      ]
        .filter((r) => r.people.length > 0)
        .map((r) => ({
          ...r,
          people: [...r.people].sort(
            (a, b) =>
              (Number(a.matricule) || 9999) - (Number(b.matricule) || 9999) ||
              a.character.nom.localeCompare(b.character.nom, "fr"),
          ),
        }))
    : [];

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <section style={{ background: accent, color: onAccent }}>
        <div className="mx-auto flex max-w-295 flex-wrap items-end justify-between gap-6 px-4 pb-8 pt-10 sm:px-5 sm:pb-10 sm:pt-14">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5.5">
            <span className="relative flex h-18 w-18 flex-none items-center justify-center overflow-hidden rounded-2xl bg-black/25 sm:h-26 sm:w-26">
              {g.imageUrl ? (
                <Image
                  src={cloudinaryUrl(
                    g.imageUrl,
                    "w_240,h_240,c_pad,b_transparent",
                  )}
                  alt=""
                  fill
                  unoptimized
                  sizes="104px"
                  className="object-contain p-2"
                />
              ) : (
                <span
                  className={cn(
                    anton.className,
                    "text-[28px] opacity-70 sm:text-[40px]",
                  )}
                >
                  {g.nom.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] opacity-80 sm:text-[13px]">
                {meta.kicker}
              </p>
              <h1
                className={cn(
                  anton.className,
                  "m-0 wrap-break-words text-[clamp(52px,10vw,120px)] font-normal leading-[0.9]",
                )}
              >
                {g.nom}
              </h1>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className={cn(anton.className, "text-[40px] leading-none")}>
                {totalMembers}
              </span>
              <span className="text-[12px] uppercase tracking-widest opacity-80">
                Membres
              </span>
            </div>
            <div className="flex flex-col">
              <span className={cn(anton.className, "text-[40px] leading-none")}>
                {tabs.filter((t) => t.id !== NONE).length}
              </span>
              <span className="text-[12px] uppercase tracking-widest opacity-80">
                Périodes
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-295 flex-col gap-8 px-4 pb-16 pt-6 sm:px-5 sm:pt-7">
        <Link
          href={g.type === "GROUPE" ? "/personnages" : meta.base}
          className="-mb-4 self-start text-[13px] text-[#A3A8B3] hover:text-[#ECECEE]"
        >
          {g.type === "GROUPE"
            ? "← Retour aux personnages"
            : `← Retour aux ${meta.plural.toLowerCase()}`}
        </Link>

        {g.description && (
          <p className="m-0 max-w-3xl whitespace-pre-line text-[16px] leading-relaxed text-[#D5D7DD]">
            {g.description}
          </p>
        )}

        {tabs.length === 0 ? (
          <p className="m-0 rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[#9AA0AA]">
            Aucun membre pour l’instant.
          </p>
        ) : (
          <>
            <nav
              aria-label="Version"
              className="-mx-4 flex gap-2 overflow-x-auto border-b border-[#23262D] px-4 pb-3.5 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              {tabs.map((t) => {
                const on = t.id === current.id;
                return (
                  <Link
                    key={t.id}
                    href={`${groupeHref(g)}?v=${t.id}`}
                    scroll={false}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 flex-none items-center gap-1 rounded-lg border px-4 text-[14px] font-bold",
                      on
                        ? "border-[#ECECEE] bg-[#ECECEE] text-[#0E0F12]"
                        : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
                    )}
                  >
                    {!on && (
                      <span
                        aria-hidden
                        className="mr-1 h-2 w-2 rounded-full"
                        style={{ background: t.color }}
                      />
                    )}
                    {t.label}
                    <span className="font-medium opacity-80">
                      · {new Set(t.members.map((m) => m.characterId)).size}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <section aria-labelledby="hier-h" className="flex flex-col gap-6">
              <h2
                id="hier-h"
                className={cn(
                  anton.className,
                  "m-0 text-[28px] font-normal uppercase sm:text-[34px]",
                )}
              >
                {g.grades.length ? "Hiérarchie" : "Membres"} · {current.label}
              </h2>
              {ranks.map((r) => (
                <div key={r.key} className="flex flex-wrap items-start gap-4">
                  <div className="flex flex-[0_0_150px] flex-col pt-1.5">
                    <span
                      className="text-[13px] font-bold uppercase tracking-widest"
                      style={{ color: r.color }}
                    >
                      {r.label}
                    </span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      {r.people.length} membre{r.people.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid min-w-0 flex-[999_1_400px] grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
                    {r.people.map((m) => {
                      const dead = m.character.etatVie === "MORT";
                      return (
                        <Link
                          key={m.id}
                          href={`/personnages/${m.character.id}`}
                          className={cn(
                            "flex min-h-16 items-center gap-3 rounded-[10px] border border-l-[3px] border-[#23262D] px-3 py-2.5 hover:bg-[#1A1D23]",
                            dead ? "bg-[#131316]" : "bg-[#15171B]",
                          )}
                          style={{ borderLeftColor: r.color }}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "relative flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-[#2B2E35] text-[15px] text-[#C4C7CF]",
                              anton.className,
                            )}
                          >
                            {m.matricule ? (
                              m.matricule
                            ) : m.character.imageUrl ? (
                              <Image
                                src={cloudinaryUrl(
                                  m.character.imageUrl,
                                  "w_80,h_80,c_fill,g_face",
                                )}
                                alt=""
                                fill
                                unoptimized
                                sizes="40px"
                                className={cn(
                                  "object-cover",
                                  dead && "grayscale",
                                )}
                              />
                            ) : (
                              m.character.nom.slice(0, 1)
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="text-[14px] font-semibold leading-tight">
                              {m.character.nom}
                              {dead && (
                                <span
                                  className="ml-1 text-[#FF8A8E]"
                                  aria-label="mort"
                                >
                                  {"✝\uFE0E"}
                                </span>
                              )}
                            </span>
                            {m.character.player && (
                              <span className="text-[12px] text-[#9AA0AA]">
                                Joué par {m.character.player.pseudo}
                              </span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
