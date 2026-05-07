'use client'

import { Character } from '@/lib/db'
import Avatar from '@/components/ui/Avatar'
import VersionPill from '@/components/ui/VersionPill'
import styles from '@/app/page.module.css'

type Props = {
  player: any
  others: Character[]
  onNavigate: (c: Character) => void
}

export default function PlayerCard({ player: pl, others, onNavigate }: Props) {
  if (!pl) return null

  return (
    <div className={styles.playerCard}>
      <div className={styles.playerTop}>
        <Avatar name={pl.pseudo} size={36} fontSize={13} />
        <div>
          <div className={styles.playerName}>{pl.pseudo}</div>
          <div className={styles.playerSub}>{others.length + 1} personnage{others.length + 1 > 1 ? 's' : ''} au total</div>
        </div>
      </div>

      <div className={styles.socialLinks}>
        {pl.discord && (
          <span className={styles.socialChip}>
            <i className="ti ti-brand-discord" style={{ fontSize: 13 }} aria-hidden="true" />
            {pl.discord}
          </span>
        )}
        {pl.tiktok && (
          <span className={styles.socialChip}>
            <i className="ti ti-brand-tiktok" style={{ fontSize: 13 }} aria-hidden="true" />
            {pl.tiktok}
          </span>
        )}
        {pl.stream_url && (
          <a href={pl.stream_url} target="_blank" rel="noreferrer" className={styles.socialChip}>
            <i className={`ti ${pl.stream_url.includes('twitch') ? 'ti-brand-twitch' : 'ti-brand-youtube'}`} style={{ fontSize: 13 }} aria-hidden="true" />
            {pl.stream_url.includes('twitch') ? 'Twitch' : 'YouTube'}
          </a>
        )}
        {!pl.discord && !pl.tiktok && !pl.stream_url && (
          <span style={{ fontSize: 12, color: '#3d3a52' }}>Aucun réseau renseigné</span>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <div className={styles.otherCharsLabel}>Autres personnages</div>
          <div className={styles.otherCharsList}>
            {others.map(o => (
              <div key={o.id} className={styles.otherCharItem} onClick={() => onNavigate(o)}>
                <div>
                  <div className={styles.otherCharName}>{o.name}</div>
                  <div className={styles.otherCharJob}>{o.job}</div>
                </div>
                <VersionPill version={o.version_id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
