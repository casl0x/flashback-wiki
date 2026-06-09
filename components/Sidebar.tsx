"use client";

import AdminButton from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Version } from "@/lib/db";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

type Props = {
  versions: Version[];
  counts: Record<string, number>;
  totalChars: number;
  totalPlayers: number;
  totalRels: number;
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  versions,
  counts,
  totalChars,
  open,
  onClose,
}: Props) {
  const pathname = usePathname();
  const allVersions = [{ id: "all", label: "Tout voir" }, ...versions];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <div className="flex flex-col gap-2 p-3 z-100">
      <Link
        href="/"
        onClick={onClose}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
      >
        Accueil
      </Link>
      <Button variant="link" className="w-full" size="sm">
        <Link href="/changelog" onClick={onClose}>
          Mise à jours
        </Link>
      </Button>

      <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[1px] text-text-faint">
        Versions
      </div>

      {allVersions.map((v) => {
        const href = v.id === "all" ? "/personnages" : `/versions/${v.id}`;
        const isOn = v.id === "all" ? isActive("/personnages") : isActive(href);
        return (
          <Link
            key={v.id}
            href={href}
            onClick={onClose}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all",
              isOn ? "bg-active border-border-accent" : "hover:bg-elevated",
            )}
          >
            <div className="flex items-center gap-2">
              {/* <div className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold font-display">
                {v.id === "all" ? <i className="ti ti-layout-grid" /> : v.id}
              </div> */}
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

      {/* Séparateur */}
      <div className="my-1 border-t border-border" />

      {/* Bouton admin/connexion */}
      <AdminButton />
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — toujours visible à partir de lg */}
      <aside className="hidden lg:flex w-50 min-w-50 flex-col border-r border-border bg-card">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-border bg-card shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
