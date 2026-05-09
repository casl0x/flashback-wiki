"use client";

type Props = {
  verLabel: string;
  filteredCount: number;
  upl: number;
  isAdmin: boolean;
  adminHref?: string;
};

export default function HeaderBlock({
  verLabel,
  filteredCount,
  upl,
  isAdmin,
  adminHref,
}: Props) {
  return (
    <div className="flex items-start justify-between mb-1.5 pb-3.5 border-b border-border">
      <div>
        <h1 className="font-display font-bold text-[21px] text-text-primary tracking-wide">
          {verLabel}
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          {filteredCount} personnage{filteredCount !== 1 ? "s" : ""} — {upl}{" "}
          joueur{upl !== 1 ? "s" : ""}
        </p>
      </div>

      {isAdmin && (
        <a
          href={adminHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-active border border-border-accent rounded-lg text-accent-light hover:bg-accent-bg transition-all no-underline"
        >
          <i className="ti ti-settings text-[12px]" aria-hidden="true" /> Admin
        </a>
      )}
    </div>
  );
}
