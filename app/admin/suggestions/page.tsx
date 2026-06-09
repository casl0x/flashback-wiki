"use client";

import { SuggestionsTab } from "@/components/admin/SuggestionsTab";

export default function SuggestionsPage() {
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Suggestions
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Valider ou refuser les propositions de modifications
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <SuggestionsTab />
      </div>
    </>
  );
}
