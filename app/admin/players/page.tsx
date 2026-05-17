"use client";

import { PlayersTab } from "@/components/admin/PlayersTab";

export default function PlayersPage() {
  return (
    <>
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
            <svg
              className="text-accent"
              width="18"
              height="18"
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
            Joueurs
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Gérer les joueurs et leurs accès
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <PlayersTab />
      </div>
    </>
  );
}
