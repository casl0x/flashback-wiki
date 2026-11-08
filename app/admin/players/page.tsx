import AdminPlayerFilters from "@/app/_composents/admin/AdminPlayerFilters";
import { ButtonLink, PageHeader } from "@/app/_composents/admin/ui";
import { playerWhere } from "@/lib/admin/player-list";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import { BADGES_CONFIG } from "@/app/_composents/admin/PlayerBadges";
import { prisma } from "@/lib/db";
import { RESEAUX_OPTIONS } from "@/lib/reseaux";
import { detectStreamPlatform } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

const FILTER_KEYS = ["q", "badge", "chaine", "compte", "persos", "sort"] as const;

type Props = {
  searchParams: Promise<{
    q?: string;
    badge?: string;
    chaine?: string;
    compte?: string;
    persos?: string;
    sort?: string;
    page?: string;
  }>;
};

const normalizeReseaux = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1] !== "",
    ),
  );
};

export default async function AdminPlayers({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = playerWhere(sp);
  const orderBy =
    sp.sort === "z→a"
      ? { pseudo: "desc" as const }
      : sp.sort === "persos"
        ? { characters: { _count: "desc" as const } }
        : sp.sort === "recent"
          ? { createdAt: "desc" as const }
          : { pseudo: "asc" as const };

  const [total, rows] = await Promise.all([
    prisma.player.count({ where }),
    prisma.player.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        _count: { select: { characters: true } },
        userProfile: { select: { pseudo: true } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const listParams = new URLSearchParams();
  for (const k of FILTER_KEYS) if (sp[k]) listParams.set(k, sp[k]!);
  const qs = (p: number) => {
    const params = new URLSearchParams(listParams);
    params.set("page", String(p));
    return `?${params}`;
  };
  if (sp.page) listParams.set("page", sp.page);
  const backHref = listParams.toString()
    ? `/admin/players?${listParams}`
    : "/admin/players";
  const editHref = (id: string) =>
    `/admin/players/${id}?back=${encodeURIComponent(backHref)}`;

  return (
    <>
      <PageHeader
        title="Joueurs"
        meta={`${total} joueur${total > 1 ? "s" : ""}`}
        actions={
          <ButtonLink href={editHref("new")} variant="primary">
            + Nouveau joueur
          </ButtonLink>
        }
      />
      <AdminPlayerFilters resultCount={rows.length} />

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
                Réseaux
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
                  colSpan={7}
                  className="bg-[#15171B] px-3 py-8 text-center text-[#9AA0AA]"
                >
                  Aucun joueur.
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const plat = p.chaines[0]
                ? detectStreamPlatform(p.chaines[0])
                : null;
              const extraChaines = Math.max(0, p.chaines.length - 1);
              const reseaux = normalizeReseaux(p.reseaux);
              const linkedReseaux = RESEAUX_OPTIONS.filter(
                (r) => reseaux[r.key],
              );
              return (
                <tr
                  key={p.id}
                  className="border-t border-[#23262D] bg-[#15171B] hover:bg-[#1A1D23]"
                >
                  <td className="px-3 py-2.5 font-semibold">
                    <Link
                      href={editHref(p.id)}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cloudinaryUrl(p.imageUrl, "w_64,h_64,c_fill,g_face")}
                          alt=""
                          className="h-8 w-8 flex-none rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#2B2E35] text-[11px] font-bold text-[#C4C7CF]"
                        >
                          {initials(p.pseudo)}
                        </span>
                      )}
                      {p.pseudo}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {p._count.characters}
                  </td>
                  <td className="px-3 py-2.5">
                    {plat ? (
                      <span className="inline-flex items-center gap-1">
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
                        {extraChaines > 0 && (
                          <span className="text-[11px] text-[#6E7380]">
                            +{extraChaines}
                          </span>
                        )}
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
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {linkedReseaux.length === 0 && (
                        <span className="text-[#6E7380]">—</span>
                      )}
                      {linkedReseaux.map((r) => (
                        <a
                          key={r.key}
                          href={reseaux[r.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={r.label}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ background: `${r.color}26`, color: r.color }}
                        >
                          {r.icon}
                        </a>
                      ))}
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
                      href={editHref(p.id)}
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
