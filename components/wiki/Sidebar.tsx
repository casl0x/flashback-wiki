"use client";

import { cn } from "@/lib/cn";
import { Version } from "@/lib/db";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Props = {
  versions: Version[];
  selected: string;
  counts: Record<string, number>;
  totalChars: number;
  totalPlayers: number;
  totalRels: number;
  onSelect: (v: string) => void;
};

export default function Sidebar({
  versions,
  selected,
  counts,
  totalChars,
  onSelect,
}: Props) {
  const allVersions = [{ id: "all", label: "Tout voir" }, ...versions];

  return (
    <aside className="w-50 min-w-50 bg-card border-r border-border p-3 flex flex-col gap-2">
      <Button
        variant="outline"
        className={cn(
          "text-[10px] mb-2",
          selected === "explain" ? "bg-active border-border-accent" : ""
        )}
        onClick={() => onSelect("explain")}
      >
        Explication du site
      </Button>

      <div className="text-[9px] font-semibold text-text-faint uppercase tracking-[1px] px-2 py-1.5">
        Versions
      </div>

      {allVersions.map((v) => {
        const isOn = selected === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
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
          </button>
        );
      })}
    </aside>
  );
}
