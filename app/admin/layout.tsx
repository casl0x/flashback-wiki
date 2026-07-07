// app/admin/layout.tsx
"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/admin/characters",
    label: "Personnages",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: "/admin/players",
    label: "Joueurs",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        <path d="M22 20c0-2.5-2-4.5-5-5" />
      </svg>
    ),
  },
  {
    href: "/admin/versions",
    label: "Versions",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
        <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
        <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
        <rect x="7" y="8" width="10" height="8" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/suggestions",
    label: "Suggestions",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    href: "/admin/creators",
    label: "Créateurs",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Topbar mobile uniquement */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm shrink-0">
            ⚡
          </div>
          <span className="font-display font-bold text-[15px] tracking-widest text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </span>
          <span className="text-[9px] text-text-muted bg-elevated px-1.5 py-0.5 rounded border border-border">
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixe desktop / drawer mobile */}
      <aside
        className={`w-52 shrink-0 flex flex-col bg-card border-r border-border h-screen z-50
          fixed top-0 left-0 transition-transform duration-200
          lg:sticky lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo (desktop uniquement) */}
        <div className="hidden lg:flex px-4 py-3.5 border-b border-border items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm shrink-0">
            ⚡
          </div>
          <span className="font-display font-bold text-[15px] tracking-widest text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </span>
          <span className="ml-auto text-[9px] text-text-muted bg-elevated px-1.5 py-0.5 rounded border border-border">
            Admin
          </span>
        </div>

        {/* Header drawer mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-border">
          <span className="text-[13px] font-medium text-text-secondary">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 pt-3 flex flex-col gap-0.5">
          <p className="px-2 pb-2 text-[9px] font-medium text-text-muted uppercase tracking-widest">
            Gestion
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent-light"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                }`}
              >
                <span className={isActive ? "text-accent" : "text-text-muted"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-[12px] text-text-muted hover:text-text-secondary hover:bg-elevated transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour au jeu
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
