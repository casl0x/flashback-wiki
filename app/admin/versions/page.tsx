"use client";

import { VersionsTab } from "@/components/admin/VersionsTab";

export default function VersionsPage() {
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
              <path d="M9 3H5a2 2 0 0 0-2 2v4" />
              <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
              <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
              <rect x="7" y="8" width="10" height="8" rx="1" />
            </svg>
            Versions
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Gérer les versions du jeu
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <VersionsTab />
      </div>
    </>
  );
}
