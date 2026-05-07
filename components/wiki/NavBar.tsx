'use client'

import styles from '@/app/page.module.css'

type Props = {
  totalChars: number
  totalPlayers: number
  totalVersions: number
  query: string
  onQueryChange: (q: string) => void
}

export default function NavBar({ totalChars, totalPlayers, totalVersions, query, onQueryChange }: Props) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navBrand}>
        <div className={styles.logoMark}>⚡</div>
        <div><div className={styles.navTitle}>FLASH<span>BACK</span></div></div>
        <span className={styles.navSub}>— Wiki WL</span>
      </div>
      <div className={styles.navSearch}>
        <i className="ti ti-search" style={{ fontSize: 13, color: '#4a4560' }} aria-hidden="true" />
        <input
          type="text"
          placeholder="Rechercher un personnage..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
        />
      </div>
      <div className={styles.navStats}>
        <span className={styles.navStat}><strong>{totalChars}</strong> persos</span>
        <span className={styles.navStat}><strong>{totalPlayers}</strong> joueurs</span>
        <span className={styles.navStat}><strong>{totalVersions}</strong> versions</span>
      </div>
    </nav>
  )
}
