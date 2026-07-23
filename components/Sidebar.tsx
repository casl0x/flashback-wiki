"use client";

import AdminButton from "@/components/admin/AdminButton";
import { cn } from "@/lib/cn";
import { BadgeInfo } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      <Link
        href="/"
        onClick={onClose}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
      >
        Accueil
      </Link>

      <Link
        href="/changelog"
        onClick={onClose}
        className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[1px] text-primary text-center hover:underline"
      >
        Mise à jour
      </Link>

      <div className="px-2 py-3 text-[9px] font-semibold uppercase tracking-[1px] text-text-faint border-t border-border">
        Wiki
      </div>

      <Link
        href="/personnages"
        onClick={onClose}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all",
          isActive("/personnages")
            ? "bg-active border-border-accent"
            : "hover:bg-elevated",
        )}
      >
        <span
          className={cn(
            "text-[13px]",
            isActive("/personnages")
              ? "text-accent-light font-medium"
              : "text-text-secondary",
          )}
        >
          Personnages
        </span>
      </Link>

      <Link
        href="/musiques"
        onClick={onClose}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all",
          isActive("/musiques")
            ? "bg-active border-border-accent"
            : "hover:bg-elevated",
        )}
      >
        <span
          className={cn(
            "text-[13px]",
            isActive("/musiques")
              ? "text-accent-light font-medium"
              : "text-text-secondary",
          )}
        >
          Musiques
        </span>
      </Link>

      <Link
        href="/createurs"
        onClick={onClose}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all",
          isActive("/createurs")
            ? "bg-active border-border-accent"
            : "hover:bg-elevated",
        )}
      >
        <span
          className={cn(
            "text-[13px]",
            isActive("/createurs")
              ? "text-accent-light font-medium"
              : "text-text-secondary",
          )}
        >
          Créateurs
        </span>
      </Link>

      {/* Séparateur */}
      <div className="my-1 border-t border-border" />
      <a
        href="https://discord.gg/9B5dn8EVsw"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-xs text-text-faint"
      >
        <BadgeInfo className="w-4 h-4" />
        <div>
          <p>Besoin d&apos;aide ?</p>
          <p>Rejoindre le Discord</p>
        </div>
      </a>

      {/* Bouton admin/connexion */}
      <div className="absolute bottom-0 left-0 w-full mb-10 px-3">
        <AdminButton />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-50 min-w-50 flex-col border-r border-border bg-card sticky top-[72px] h-[calc(100vh-72px)]">
        <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
          {content}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-border bg-card shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
