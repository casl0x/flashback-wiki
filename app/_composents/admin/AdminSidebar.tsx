"use client";

import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string; exact?: boolean; badge?: number };
type Section = { title?: string; items: Item[] };

export default function AdminSidebar({
  pending,
  admin,
}: {
  pending: number;
  admin: { name: string; imageUrl: string | null } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sections: Section[] = [
    {
      items: [
        { href: "/admin", label: "Tableau de bord", exact: true },
        { href: "/admin/moderation", label: "Modération", badge: pending },
      ],
    },
    {
      title: "Données",
      items: [
        { href: "/admin/characters", label: "Personnages" },
        { href: "/admin/players", label: "Joueurs" },
        { href: "/admin/groupes", label: "Groupes" },
        { href: "/admin/versions", label: "Versions" },
      ],
    },
    {
      title: "Communauté",
      items: [
        { href: "/admin/creators", label: "Créateurs" },
        { href: "/admin/announcements", label: "Annonces" },
        { href: "/admin/polls", label: "Sondages" },
      ],
    },
    { title: "Équipe", items: [{ href: "/admin/users", label: "Utilisateurs" }] },
  ];

  const isActive = (i: Item) => (i.exact ? pathname === i.href : pathname.startsWith(i.href));

  const nav = (
    <nav aria-label="Administration" className="flex flex-col gap-0.5">
      {sections.map((s, si) => (
        <div key={si} className="flex flex-col gap-0.5">
          {s.title && (
            <span className="px-2.5 pb-1 pt-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#80858F]">
              {s.title}
            </span>
          )}
          {s.items.map((i) => {
            const on = isActive(i);
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] font-semibold",
                  on ? "bg-[#1F2A44] text-white" : "text-[#C4C7CF] hover:bg-[#1A1C21] hover:text-white",
                )}
              >
                <span>{i.label}</span>
                {!!i.badge && (
                  <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#E5484D] px-1.5 text-[11px] font-bold text-white">
                    {i.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#23262D] bg-[#121418] px-3 lg:hidden">
        <Link href="/admin" className={cn(anton.className, "text-[18px] tracking-[0.04em] text-[#ECECEE]")}>
          FLASHBACK <span className="text-[#2F6FEB]">ADMIN</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[#ECECEE]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[250px] flex-col gap-5 overflow-y-auto border-r border-[#23262D] bg-[#121418] px-3.5 py-5 transition-transform lg:sticky lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" className={cn(anton.className, "text-[20px] tracking-[0.04em] text-[#ECECEE]")}>
            FLASHBACK <span className="text-[#2F6FEB]">ADMIN</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#A3A8B3] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nav}
        <div className="mt-auto flex flex-col gap-2.5 px-2">
          <Link href="/" className="text-[13px] text-[#A3A8B3] hover:text-[#ECECEE]">
            ← Retour au site
          </Link>
          {admin && (
            <span className="flex items-center gap-2.5">
              {admin.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={admin.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B2E35] text-[11px] font-bold">
                  {admin.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="flex flex-col">
                <span className="font-semibold text-[#ECECEE]">{admin.name}</span>
                <span className="text-[12px] text-[#9AA0AA]">Admin</span>
              </span>
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
