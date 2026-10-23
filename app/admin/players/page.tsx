import { ButtonLink, PageHeader, TextInput } from "@/app/_composents/admin/ui";
import { BADGES_CONFIG } from "@/components/admin/PlayerBadges";
import { prisma } from "@/lib/db";
import { detectStreamPlatform } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminPlayers({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.PlayerWhereInput = sp.q?.trim()
    ? { pseudo: { contains: sp.q.trim(), mode: "insensitive" } }
    : {};

  const [total, rows] = await Promise.all([
    prisma.player.count({ where }),
    prisma.player.findMany({
      where,
      orderBy: { pseudo: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        _count: { select: { characters: true } },
        userProfile: { select: { pseudo: true } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Joueurs"
        meta={`${total} joueur${total > 1 ? "s" : ""}`}
        actions={
          <ButtonLink href="/admin/players/new" variant="primary">
            + Nouveau joueur
          </ButtonLink>
        }
      />
      <form role="search" className="flex gap-2.5">
        <TextInput
          name="q"
          defaultValue={sp.q}
          placeholder="Rechercher un pseudo…"
          aria-label="Rechercher"
          className="max-w-90"
        />
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-[#22252B] px-4 font-bold hover:bg-[#2B2E35]"
        >
          Rechercher
        </button>
      </form>

      <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
        <table className="w-full min-w-180 border-collapse text-left">
          <thead>
            <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
              <th scope="col" className="px-3 py-2.5">
                Pseudo
              </th>
              <th scope="col" className="px-3 py-2.5">
                Persos
              </th>
              <th scope="col" className="px-3 py-2.5">
                Chaîne
              </th>
              <th scope="col" className="px-3 py-2.5">
                Badges
              </th>
              <th scope="col" className="px-3 py-2.5">
                Compte lié
              </th>
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="bg-[#15171B] px-3 py-8 text-center text-[#9AA0AA]"
                >
                  Aucun joueur.
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const plat = detectStreamPlatform(p.lienChaine);
              return (
                <tr
                  key={p.id}
                  className="border-t border-[#23262D] bg-[#15171B] hover:bg-[#1A1D23]"
                >
                  <td className="px-3 py-2.5 font-semibold">
                    <Link
                      href={`/admin/players/${p.id}`}
                      className="hover:underline"
                    >
                      {p.pseudo}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {p._count.characters}
                  </td>
                  <td className="px-3 py-2.5">
                    {plat ? (
                      <span
                        className="rounded px-2 py-0.5 text-[11px] font-extrabold"
                        style={
                          plat === "twitch"
                            ? { background: "#9146FF", color: "#fff" }
                            : { background: "#53FC18", color: "#0E0F12" }
                        }
                      >
                        {plat === "twitch" ? "Twitch" : "Kick"}
                      </span>
                    ) : (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {p.badges.length === 0 && (
                        <span className="text-[#6E7380]">—</span>
                      )}
                      {p.badges.map((b) => {
                        const cfg = BADGES_CONFIG.find((x) => x.key === b);
                        return (
                          <span
                            key={b}
                            className="rounded-full border px-2 py-px text-[11px] font-semibold"
                            style={{
                              color: cfg?.color,
                              borderColor: `${cfg?.color ?? "#3A3E47"}66`,
                            }}
                          >
                            {cfg?.label ?? b}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {p.userProfile ? (
                      (p.userProfile.pseudo ?? "Oui")
                    ) : (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/players/${p.id}`}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#3A3E47] px-2.5 text-[13px] hover:bg-[#1F2228]"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Pagination"
        className="flex items-center justify-between text-[13px] text-[#A3A8B3]"
      >
        <span>
          Page {page} sur {pages}
        </span>
        <span className="flex gap-2">
          {page > 1 && <ButtonLink href={qs(page - 1)}>← Précédent</ButtonLink>}
          {page < pages && (
            <ButtonLink href={qs(page + 1)}>Suivant →</ButtonLink>
          )}
        </span>
      </nav>
    </>
  );
}
