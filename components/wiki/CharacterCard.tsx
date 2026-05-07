"use client";

import styles from "@/app/page.module.css";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import VersionPill from "@/components/ui/VersionPill";
import { Character } from "@/lib/db";

type Props = {
  character: Character;
  onClick: () => void;
};

export default function CharacterCard({ character: c, onClick }: Props) {
  return (
    <div className={styles.charCard} onClick={onClick}>
      <Avatar
        name={c.name}
        size={36}
        fontSize={13}
        style={{ marginBottom: 9 }}
      />
      <div className={styles.charName}>{c.name}</div>
      <div className={styles.charJob}>{c.job}</div>
      <div className={styles.charMeta}>
        <VersionPill version={c.version_id} />
        <span className={styles.charPlayer}>{(c.player as any)?.pseudo}</span>
      </div>
      {c.status && (
        <div style={{ marginTop: 6 }}>
          <StatusBadge status={c.status as any} small />
        </div>
      )}
    </div>
  );
}
