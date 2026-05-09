"use client";

type Props = {
  verLabel: string;
  filteredCount: number;
  upl: number;
};

export default function HeaderBlock({ verLabel, filteredCount, upl }: Props) {
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
    </div>
  );
}
