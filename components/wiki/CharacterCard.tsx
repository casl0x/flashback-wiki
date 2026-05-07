'use client'

import { Character } from '@/lib/db'
import Avatar from '@/components/ui/Avatar'
import VersionPill from '@/components/ui/VersionPill'
import styles from '@/app/page.module.css'

type Props = {
  character: Character
  onClick: () => void
}

export default function CharacterCard({ character: c, onClick }: Props) {
  return (
    <div className={styles.charCard} onClick={onClick}>
      <Avatar name={c.name} size={36} fontSize={13} style={{ marginBottom: 9 }} />
      <div className={styles.charName}>{c.name}</div>
      <div className={styles.charJob}>{c.job}</div>
      <div className={styles.charMeta}>
        <VersionPill version={c.version_id} />
        <span className={styles.charPlayer}>{(c.player as any)?.pseudo}</span>
      </div>
    </div>
  )
}
