import {
  ButtonLink,
  Empty,
  LinkTabs,
  PageHeader,
  TextInput,
} from "@/app/_composents/admin/ui";
import { CHANGELOG_STYLE, ago, shortDate } from "@/lib/admin/format";
import { displayNames } from "@/lib/admin/moderation";
import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import SiteUpdateForm from "./SiteUpdateForm";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

type Props = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    filtre?: string;
    page?: string;
  }>;
};

async function loadAdmins() {
  const orgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
  if (!orgId) return null;
  try {
    const client = await clerkClient();
    const { data } = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });
    return data.map((m) => ({
      id: m.id,
      name: m.publicUserData?.identifier ?? "Admin",
      username:
        [m.publicUserData?.firstName, m.publicUserData?.lastName]
          .filter(Boolean)
          .join(" ") || null,
      imageUrl: m.publicUserData?.imageUrl ?? null,
      since: new Date(m.createdAt).toISOString(),
    }));
  } catch {
    return null;
  }
}

export default async function AdminUsers({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = sp.tab === "admins" || sp.tab === "maj" ? sp.tab : "membres";
  const page = Math.max(1, Number(sp.page) || 1);
  const [memberCount, adminsForCount] = await Promise.all([
    prisma.userProfile.count(),
    tab === "admins" ? loadAdmins() : null,
  ]);

  let body: React.ReactNode = null;

  if (tab === "membres") {
    const and: Prisma.UserProfileWhereInput[] = [];
    if (sp.q?.trim())
      and.push({ pseudo: { contains: sp.q.trim(), mode: "insensitive" } });
    if (sp.filtre === "createurs")
      and.push({ creatorRoles: { some: { status: "approved" } } });
    if (sp.filtre === "joueur") and.push({ playerId: { not: null } });
    if (sp.filtre === "onboarding") and.push({ onboardingComplete: false });
    const where = and.length ? { AND: and } : {};
    const [total, rows] = await Promise.all([
      prisma.userProfile.count({ where }),
      prisma.userProfile.findMany({
        where,
        orderBy: [{ totalPoints: "desc" }, { createdAt: "asc" }],
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        include: {
          player: { select: { id: true, pseudo: true } },
          creatorRoles: {
            where: { status: "approved" },
            select: { type: true },
          },
        },
      }),
    ]);
    const names = await displayNames(
      rows.filter((r) => !r.pseudo).map((r) => r.clerkUserId),
    );
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const qs = (p: number) =>
      `?${new URLSearchParams({ tab, ...(sp.q ? { q: sp.q } : {}), ...(sp.filtre ? { filtre: sp.filtre } : {}), page: String(p) })}`;

    body = (
      <>
        <form role="search" className="flex flex-wrap gap-2.5">
          <input type="hidden" name="tab" value="membres" />
          <TextInput
            name="q"
            defaultValue={sp.q}
            placeholder="Rechercher un pseudo…"
            aria-label="Rechercher un membre"
            className="max-w-90 flex-[1_1_240px]"
          />
          <select
            name="filtre"
            defaultValue={sp.filtre ?? ""}
            aria-label="Filtrer"
            className="min-h-10 rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-2.5 text-[#ECECEE]"
          >
            <option value="">Tous</option>
            <option value="createurs">Créateurs</option>
            <option value="joueur">Joueur lié</option>
            <option value="onboarding">Onboarding non terminé</option>
          </select>
          <button
            type="submit"
            className="min-h-10 rounded-lg bg-[#22252B] px-4 font-bold hover:bg-[#2B2E35]"
          >
            Filtrer
          </button>
        </form>
        <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
          <table className="w-full min-w-190 border-collapse text-left">
            <thead>
              <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
                <th scope="col" className="px-3 py-2.5">
                  Pseudo
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Points
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Ajouts validés
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Badges
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Créateur
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Joueur lié
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Inscrit
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
                    Aucun membre.
                  </td>
                </tr>
              )}
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[#23262D] bg-[#15171B]"
                >
                  <td className="px-3 py-2.5 font-semibold">
                    {u.pseudo ?? names.get(u.clerkUserId) ?? "Utilisateur"}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {u.totalPoints}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {u.acceptedCount}
                  </td>
                  <td className="px-3 py-2.5 text-[#9AA0AA]">
                    {u.badges.length ? u.badges.join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[#F6B26B]">
                    {u.creatorRoles.length ? (
                      u.creatorRoles
                        .map((r) =>
                          r.type === "ARTISTE" ? "Artiste" : "Éditeur",
                        )
                        .join(", ")
                    ) : (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {u.player ? (
                      <Link
                        href={`/admin/players/${u.player.id}`}
                        className="text-[#C9A8FF] hover:underline"
                      >
                        {u.player.pseudo}
                      </Link>
                    ) : (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#9AA0AA]">
                    {shortDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between text-[13px] text-[#A3A8B3]"
        >
          <span>
            {total} membre{total > 1 ? "s" : ""} · page {page} sur {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <ButtonLink href={qs(page - 1)}>← Précédent</ButtonLink>
            )}
            {page < pages && (
              <ButtonLink href={qs(page + 1)}>Suivant →</ButtonLink>
            )}
          </span>
        </nav>
      </>
    );
  } else if (tab === "admins") {
    const admins = adminsForCount;
    body = (
      <div className="flex flex-col gap-4">
        <p className="m-0 rounded-[10px] border border-[#22385E] bg-[#13213A] px-4 py-3.5 text-[#CFE0FF]">
          Les admins sont les membres de l’organisation Clerk du wiki. Pour en
          ajouter ou en retirer, passe par Clerk : ils ont tous les mêmes
          droits.
        </p>
        {admins === null ? (
          <Empty>
            Impossible de lire l’organisation Clerk (variable
            NEXT_PUBLIC_CLERK_ADMIN_ORG_ID ou accès Clerk).
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-[#23262D]">
            {admins.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 border-b border-[#23262D] bg-[#15171B] p-3 last:border-b-0"
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B2E35] text-[11px] font-bold">
                    {a.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{a.username ?? a.name}</span>
                  <span className="text-[12px] text-[#9AA0AA]">
                    {a.name} · membre depuis le {shortDate(a.since)}
                  </span>
                </span>
                <span className="rounded-full bg-[#2A2113] px-2 py-px text-[11px] font-bold text-[#F6B26B]">
                  Admin
                </span>
              </div>
            ))}
          </div>
        )}
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center self-start rounded-lg bg-[#2F6FEB] px-4 font-bold text-white hover:bg-[#2A63D4]"
        >
          Gérer les admins dans Clerk ↗
        </a>
      </div>
    );
  } else {
    const entries = await prisma.changelogEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    body = (
      <div className="flex flex-col gap-2.5">
        <SiteUpdateForm />
        <span className="text-[12px] text-[#9AA0AA]">
          Les 100 dernières entrées de la page publique « Mises à jour ».
        </span>
        {entries.length === 0 ? (
          <Empty>Aucune entrée.</Empty>
        ) : (
          <ol className="m-0 list-none overflow-hidden rounded-[10px] border border-[#23262D] p-0">
            {entries.map((e) => {
              const st = CHANGELOG_STYLE[e.type] ?? {
                label: e.type,
                color: "#C4C7CF",
              };
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-3 border-b border-[#23262D] bg-[#15171B] px-3 py-2.5 last:border-b-0"
                >
                  <span
                    className="w-38 flex-none rounded bg-[#1F2228] px-2 py-0.5 text-center text-[11px] font-bold"
                    style={{ color: st.color }}
                  >
                    {st.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong>{e.label}</strong>
                    {e.detail && (
                      <span className="text-[#9AA0AA]"> · {e.detail}</span>
                    )}
                  </span>
                  <span className="text-[12px] text-[#9AA0AA]">
                    {ago(e.createdAt)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        meta={`${memberCount} compte${memberCount > 1 ? "s" : ""}`}
      />
      <LinkTabs
        tabs={[
          { href: "/admin/users", label: "Membres", active: tab === "membres" },
          {
            href: "/admin/users?tab=admins",
            label: "Admins",
            active: tab === "admins",
          },
          {
            href: "/admin/users?tab=maj",
            label: "Mises à jour",
            active: tab === "maj",
          },
        ]}
      />
      {body}
    </>
  );
}
