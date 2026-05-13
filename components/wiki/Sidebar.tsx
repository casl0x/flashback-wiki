"use client";

import { cn } from "@/lib/cn";
import { Version } from "@/lib/db";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "../ui/badge";

type Props = {
  versions: Version[];
  counts: Record<string, number>;
  totalChars: number;
  totalPlayers: number;
  totalRels: number;
};

export default function Sidebar({ versions, counts, totalChars }: Props) {
  const pathname = usePathname();
  const allVersions = [{ id: "all", label: "Tout voir" }, ...versions];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="w-50 min-w-50 border-r border-border bg-card p-3 flex flex-col gap-2">
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
      >
        Explication du site
      </Link>

      <div className="text-[9px] font-semibold text-text-faint uppercase tracking-[1px] px-2 py-1.5">
        Versions
      </div>

      {allVersions.map((v) => {
        const href = v.id === "all" ? "/personnages" : `/versions/${v.id}`;
        const isOn = v.id === "all" ? isActive("/personnages") : isActive(href);
        return (
          <Link
            key={v.id}
            href={href}
            className={cn(
              "flex items-center justify-between px-2.5 py-1.5 rounded-lg w-full text-left transition-all",
              isOn ? "bg-active border-border-accent" : "hover:bg-elevated",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-display">
                {v.id === "all" ? <i className="ti ti-layout-grid" /> : v.id}
              </div>
              <div
                className={cn(
                  "text-[13px]",
                  isOn
                    ? "text-accent-light font-medium"
                    : "text-text-secondary",
                )}
              >
                {v.id === "all" ? "Tout voir" : v.label}
              </div>
            </div>
            <Badge>{v.id === "all" ? totalChars : counts[v.id] || 0}</Badge>
          </Link>
        );
      })}
    </aside>
  );
}
