import { CHANGELOG_STYLE, ago } from "@/lib/admin/format";
import {
  countPending,
  loadQueue,
  type QueueItem,
} from "@/lib/admin/moderation";
import { prisma } from "@/lib/db";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonLink, PageHeader } from "../_composents/admin/ui";
import { fetchTopPersonnages } from "../_composents/homepage/TopPages";

export const dynamic = "force-dynamic";

async function topViewed() {
  try {
    return await fetchTopPersonnages(5, "30d");
  } catch {
    return null; // Variables Vercel absentes ou API indisponible.
  }
}

export default async function AdminDashboard() {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [
    chars,
    charsMonth,
    players,
    playersMonth,
    versions,
    pending,
    changelog,
    top,
    ...queues
  ] = await Promise.all([
    prisma.character.count(),
    prisma.character.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.player.count(),
    prisma.player.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.version.count(),
    countPending(),
    prisma.changelogEntry.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    topViewed(),
    loadQueue("propositions", 5),
    loadQueue("creations", 5),
    loadQueue("signalements", 5),
    loadQueue("liens", 5),
  ]);

  const queue: QueueItem[] = (queues as QueueItem[][])
    .flat()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 6);

  const stats = [
    {
      label: "Personnages",
      value: chars,
      sub: `+${charsMonth} ce mois`,
      c: "#2F6FEB",
    },
    {
      label: "Joueurs",
      value: players,
      sub: `+${playersMonth} ce mois`,
      c: "#9146FF",
    },
    { label: "Versions", value: versions, sub: "", c: "#E4B44A" },
    {
      label: "À modérer",
      value: pending.total,
      sub: "propositions, créations, signalements, liens",
      c: "#E5484D",
    },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        actions={
          <>
            <ButtonLink href="/admin/characters/new" variant="primary">
              + Personnage
            </ButtonLink>
            <ButtonLink href="/admin/players/new">+ Joueur</ButtonLink>
            <ButtonLink href="/admin/groupes/new">+ Groupe</ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-0.5 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4"
            style={{ borderTop: `3px solid ${s.c}` }}
          >
            <span className="text-[12px] font-bold uppercase tracking-widest text-[#A3A8B3]">
              {s.label}
            </span>
            <span className={cn(anton.className, "text-[40px] leading-[1.05]")}>
              {s.value}
            </span>
            <span className="text-[12px] text-[#9AA0AA]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="todo-h"
          className="flex min-w-0 flex-[999_1_420px] flex-col gap-3"
        >
          <h2
            id="todo-h"
            className="m-0 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C4C7CF]"
          >
            À traiter
          </h2>
          {queue.length === 0 ? (
            <p className="m-0 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4 text-[#9AA0AA]">
              Rien à modérer. 🎉
            </p>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#23262D]">
              {queue.map((q) => (
                <Link
                  key={`${q.tab}-${q.id}`}
                  href={`/admin/moderation?tab=${q.tab}&id=${q.id}`}
                  className="flex items-center gap-3.5 border-b border-[#23262D] bg-[#15171B] px-4 py-3 last:border-b-0 hover:bg-[#1A1D23]"
                >
                  <span
                    className="flex-none rounded bg-[#1F2228] px-2 py-0.5 text-[11px] font-bold"
                    style={{ color: q.color }}
                  >
                    {q.kind}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{q.title}</span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      par {q.author} · {ago(q.createdAt)}
                    </span>
                  </span>
                  <span className="hidden text-[13px] text-[#A3A8B3] sm:inline">
                    Examiner →
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/admin/moderation"
            className="self-start text-[13px] font-semibold text-[#8AB4FF] hover:text-[#B9D2FF]"
          >
            Tout voir dans Modération →
          </Link>
        </section>

        <section
          aria-labelledby="act-h"
          className="flex min-w-0 flex-[1_1_320px] flex-col gap-3"
        >
          <h2
            id="act-h"
            className="m-0 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C4C7CF]"
          >
            Dernières mises à jour
          </h2>
          <ol className="m-0 flex list-none flex-col gap-3.5 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4">
            {changelog.length === 0 && (
              <li className="text-[#9AA0AA]">Aucune mise à jour.</li>
            )}
            {changelog.map((e) => {
              const st = CHANGELOG_STYLE[e.type] ?? {
                label: e.type,
                color: "#C4C7CF",
              };
              return (
                <li key={e.id} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-2 h-2 w-2 flex-none rounded-full"
                    style={{ background: st.color }}
                  />
                  <span className="flex flex-col">
                    <span>
                      <strong>{e.label}</strong> · {st.label}
                      {e.detail && (
                        <span className="text-[#9AA0AA]"> ({e.detail})</span>
                      )}
                    </span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      {ago(e.createdAt)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <h2 className="m-0 mt-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C4C7CF]">
            Plus consultés · 30 jours
          </h2>
          {top && top.length > 0 ? (
            <ol className="m-0 flex flex-col gap-1.5 rounded-[10px] border border-[#23262D] bg-[#15171B] py-3 pl-9 pr-4">
              {top.map((t) => (
                <li key={t.path}>
                  <Link
                    href={t.path}
                    className="text-[#ECECEE] hover:underline"
                  >
                    {t.name}
                  </Link>
                  <span className="text-[#9AA0AA]"> · {t.views} vues</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="m-0 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4 text-[13px] text-[#9AA0AA]">
              Statistiques indisponibles (Vercel Web Analytics).
            </p>
          )}
        </section>
      </div>
    </>
  );
}
