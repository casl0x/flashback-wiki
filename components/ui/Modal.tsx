'use client'

type Props = {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}

const bS = {
  padding: '6px 14px', fontSize: 13,
  border: '0.5px solid #2a2535', borderRadius: 8,
  background: 'transparent', color: '#8880a8', cursor: 'pointer',
}

export default function Modal({ title, onClose, children, maxWidth = 520 }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px 16px', zIndex: 100, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#111019', border: '0.5px solid #2a2535', borderRadius: 12, padding: 22, width: '100%', maxWidth, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: '#e2dff0', letterSpacing: '.3px' }}>{title}</span>
          <button style={bS} onClick={onClose}>Fermer</button>
        </div>
        {children}
      </div>
    </div>
  )
}
