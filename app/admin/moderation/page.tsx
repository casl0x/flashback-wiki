import { Empty, LinkTabs, PageHeader } from "@/app/_composents/admin/ui";
import { ago } from "@/lib/admin/format";
import {
  MOD_TABS,
  countPending,
  loadCreationDetail,
  loadCreatorRoleDetail,
  loadLinkRequestDetail,
  loadQueue,
  loadSuggestionDetail,
  type ModTab,
} from "@/lib/admin/moderation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CreationReview,
  CreatorRoleReview,
  LinkRequestReview,
  SuggestionReview,
} from "./Reviews";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tab?: string; id?: string }> };

export default async function ModerationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tab: ModTab = MOD_TABS.some((t) => t.key === sp.tab)
    ? (sp.tab as ModTab)
    : "propositions";
  const [counts, items] = await Promise.all([countPending(), loadQueue(tab)]);

  const selectedId = items.some((i) => i.id === sp.id) ? sp.id! : items[0]?.id;
  const idx = items.findIndex((i) => i.id === selectedId);
  // Après une action, on passe à l'élément suivant (ou précédent s'il n'y en a plus).
  const nextId = items[idx + 1]?.id ?? items[idx - 1]?.id ?? null;
  const nextHref = `/admin/moderation?tab=${tab}${nextId ? `&id=${nextId}` : ""}`;

  let detail: React.ReactNode = null;
  if (selectedId) {
    if (tab === "propositions") {
      const d = await loadSuggestionDetail(selectedId);
      if (d) detail = <SuggestionReview d={d} nextHref={nextHref} />;
    } else if (tab === "creations") {
      const d = await loadCreationDetail(selectedId);
      if (d) detail = <CreationReview d={d} nextHref={nextHref} />;
    } else if (tab === "createurs") {
      const d = await loadCreatorRoleDetail(selectedId);
      if (d) detail = <CreatorRoleReview d={d} nextHref={nextHref} />;
    } else {
      const d = await loadLinkRequestDetail(selectedId);
      if (d) detail = <LinkRequestReview d={d} nextHref={nextHref} />;
    }
  }

  return (
    <>
      <PageHeader title="Modération" />
      <LinkTabs
        tabs={MOD_TABS.map((t) => ({
          href: `/admin/moderation?tab=${t.key}`,
          label: t.label,
          count: counts[t.key],
          active: t.key === tab,
        }))}
      />

      {items.length === 0 ? (
        <Empty>Rien en attente dans cet onglet.</Empty>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <nav
            aria-label="File d’attente"
            className="flex max-h-[70vh] min-w-0 flex-[1_1_280px] flex-col overflow-y-auto rounded-[10px] border border-[#23262D] lg:max-w-85"
          >
            {items.map((i) => {
              const on = i.id === selectedId;
              return (
                <Link
                  key={i.id}
                  href={`/admin/moderation?tab=${tab}&id=${i.id}`}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-l-[3px] border-b-[#23262D] px-3.5 py-3 last:border-b-0",
                    on
                      ? "border-l-[#2F6FEB] bg-[#1A2233]"
                      : "border-l-transparent bg-[#15171B] hover:bg-[#1A1D23]",
                  )}
                >
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: i.color }}
                  >
                    {i.kind}
                  </span>
                  <span className="font-semibold">{i.title}</span>
                  <span className="text-[12px] text-[#9AA0AA]">
                    par {i.author} · {ago(i.createdAt)}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0 flex-[999_1_520px]">
            {detail ?? <Empty>Élément introuvable.</Empty>}
          </div>
        </div>
      )}
    </>
  );
}
