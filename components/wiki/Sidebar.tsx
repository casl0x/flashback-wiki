"use client";

import styles from "@/app/page.module.css";
import { Version } from "@/lib/db";
import { vBadgeBg, vBadgeFg } from "@/lib/utils";

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
  totalPlayers,
  totalRels,
  onSelect,
}: Props) {
  const allVersions = [{ id: "all", label: "Tout voir" }, ...versions];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sbLabel}>Versions</div>
      {allVersions.map((v) => {
        const isOn = selected === v.id;
        const bg = v.id === "all" ? "#1e1c2a" : vBadgeBg(v.id);
        const fg = v.id === "all" ? "#6b6880" : vBadgeFg(v.id);
        return (
          <div
            key={v.id}
            className={`${styles.verBtn} ${isOn ? styles.verBtnOn : ""}`}
            onClick={() => onSelect(v.id)}
          >
            <div className={styles.verBtnL}>
              <div
                className={styles.verBadge}
                style={{ background: bg, color: fg }}
              >
                {v.id === "all" ? (
                  <i
                    className="ti ti-layout-grid"
                    style={{ fontSize: 10 }}
                    aria-hidden="true"
                  />
                ) : (
                  v.id
                )}
              </div>
              <span className={styles.verName}>
                {v.id === "all" ? "Tout voir" : v.label}
              </span>
            </div>
            <span className={styles.verCount}>
              {v.id === "all" ? totalChars : counts[v.id] || 0}
            </span>
          </div>
        );
      })}

      <div className={styles.sbDivider}>
        <div className={styles.sbLabel} style={{ paddingTop: 10 }}>
          Statistiques
        </div>
        <div className={styles.sbStatRow}>
          <span className={styles.sbStatLabel}>Personnages</span>
          <span className={styles.sbStatVal}>{totalChars}</span>
        </div>
        <div className={styles.sbStatRow}>
          <span className={styles.sbStatLabel}>Joueurs</span>
          <span className={styles.sbStatVal}>{totalPlayers}</span>
        </div>
        <div className={styles.sbStatRow}>
          <span className={styles.sbStatLabel}>Relations</span>
          <span className={styles.sbStatVal}>{totalRels}</span>
        </div>
      </div>
    </aside>
  );
}
