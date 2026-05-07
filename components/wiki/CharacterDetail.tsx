'use client'

import { Character } from '@/lib/db'
import Avatar from '@/components/ui/Avatar'
import VersionPill from '@/components/ui/VersionPill'
import PlayerCard from '@/components/wiki/PlayerCard'
import styles from '@/app/page.module.css'

type Props = {
  character: Character
  allCharacters: Character[]
  onBack: () => void
  onNavigate: (c: Character) => void
}

export default function CharacterDetail({ character: c, allCharacters, onBack, onNavigate }: Props) {
  const pl = c.player as any
  const rels = c.relations || []
  const others = allCharacters.filter(x => (x.player as any)?.id === pl?.id && x.id !== c.id)

  return (
    <div className={styles.content}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Retour
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Fiche personnage */}
        <div className={styles.detailCard}>
          <div className={styles.detailTop}>
            <Avatar name={c.name} size={52} fontSize={18} />
            <div>
              <div className={styles.detailName}>{c.name}</div>
              <div className={styles.detailJob}>{c.job}</div>
              <VersionPill version={c.version_id} />
            </div>
          </div>

          {c.description && <p className={styles.detailDesc}>{c.description}</p>}

          {(c.tags || []).length > 0 && (
            <div className={styles.tagList}>
              {(c.tags || []).map((t: string) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          )}

          {rels.length > 0 && (
            <RelationsList
              relations={rels}
              allCharacters={allCharacters}
              onNavigate={onNavigate}
            />
          )}
        </div>

        {/* Fiche joueur */}
        <PlayerCard player={pl} others={others} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

// Sous-composant relations
function RelationsList({ relations, allCharacters, onNavigate }: {
  relations: any[]
  allCharacters: Character[]
  onNavigate: (c: Character) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#4a4560', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>
        Relations
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {relations.map((r: any) => {
          const tc = r.target
          if (!tc) return null
          const full = allCharacters.find(c => c.id === tc.id)
          return (
            <div
              key={r.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: '#1a1824', borderRadius: 8, cursor: 'pointer', border: '0.5px solid transparent', transition: 'all .15s' }}
              onClick={() => { if (full) onNavigate(full) }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2535' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#2a1040', border: '0.5px solid #4c2d8a', color: '#a78bfa', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '.3px' }}>
                  {r.relation_type}
                </span>
                <div>
                  <div style={{ fontSize: 13, color: '#e2dff0', fontWeight: 500 }}>{tc.name}</div>
                  <div style={{ fontSize: 10, color: '#4a4560' }}>{tc.player?.pseudo} — {tc.version_id}</div>
                </div>
              </div>
              <Avatar name={tc.name} size={28} fontSize={10} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
