"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  perPage: number;
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
}: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex items-center gap-1.5 py-4 text-[13px]">
      <button
        className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-text-primary hover:bg-surface disabled:opacity-35"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Page précédente"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} className="px-1 text-text-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(Number(p))}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 transition-colors ${
              p === page
                ? "border-border-strong bg-surface font-medium"
                : "border-border bg-card text-text-primary hover:bg-surface"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-text-primary hover:bg-surface disabled:opacity-35"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight size={14} />
      </button>

      <span className="ml-auto text-[12px] text-text-faint">
        {totalItems} personnages · {perPage} par page
      </span>
    </div>
  );
}

function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}
