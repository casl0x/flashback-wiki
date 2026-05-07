'use client'

import { useState } from 'react'
import { Character, Player, Version } from '@/lib/db'
import Modal from '@/components/ui/Modal'

const REL_TYPES = ['Père','Mère','Fils','Fille','Frère','Sœur','Cousin','Cousine','Oncle','Tante','Grand-père','Grand-mère','Ami','Amie','Associé','Associée','Rival','Rivale','Ennemi','Ennemie','Mentor','Protégé','Partenaire','Ex','Autre']

const inp = { background: '#1a1824', border: '0.5px solid #2a2535', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#e2dff0', fontFamily: 'Inter,sans-serif', width: '100%', outline: 'none' }
const lbl = { fontSize: 11, fontWeight: 500, color: '#4a4560', textTransform: 'uppercase' as const, letterSpacing: '.5px', display: 'block', marginBottom: 4 }
const bP = { padding: '8px 16px', fontSize: 13, fontWeight: 500, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }
const bS = { padding: '8px 16px', fontSize: 13, border: '0.5px solid #2a2535', borderRadius: 8, background: 'transparent', color: '#8880a8', cursor: 'pointer' }

type CharFormProps = {
  editing: Character | null
  players: Player[]
  versions: Version[]
  characters: Character[]
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>, rels: { type: string; targetId: number }[]) => void
}

export function CharacterForm({ editing, players, versions, characters, onClose, onSubmit }: CharFormProps) {
  const [rels, setRels] = useState<{ type: string; targetId: number }[]>(
    (editing?.relations || []).map((r: any) => ({ type: r.relation_type, targetId: r.target_id }))
  )

  return (
    <Modal
      title={editing ? `Modifier — ${editing.name}` : 'Nouveau personnage'}
      onClose={onClose}
    >
      <form onSubmit={e => onSubmit(e, rels)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Nom</label><input name="name" defaultValue={editing?.name || ''} required style={inp} /></div>
          <div><label style={lbl}>Rôle / Métier</label><input name="job" defaultValue={editing?.job || ''} required style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={lbl}>Joueur</label>
            <select name="player_id" defaultValue={(editing?.player as any)?.id || ''} required style={inp}>
              <option value="">— Sélectionner —</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.pseudo}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Version</label>
            <select name="version_id" defaultValue={editing?.version_id || ''} required style={inp}>
              <option value="">— Sélectionner —</option>
              {versions.map(v => <option key={v.id} value={v.id}>{v.id} — {v.label}</option>)}
            </select>
          </div>
        </div>
        <div><label style={lbl}>Description</label><textarea name="description" defaultValue={editing?.description || ''} style={{ ...inp, resize: 'vertical', minHeight: 60 }} /></div>
        <div><label style={lbl}>Tags (virgules)</label><input name="tags" defaultValue={(editing?.tags || []).join(', ')} style={inp} /></div>

        {/* Relations */}
        <RelationsEditor
          rels={rels}
          onChange={setRels}
          characters={characters}
          excludeId={editing?.id}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" style={bS} onClick={onClose}>Annuler</button>
          <button type="submit" style={bP}>{editing ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </form>
    </Modal>
  )
}

function RelationsEditor({ rels, onChange, characters, excludeId }: {
  rels: { type: string; targetId: number }[]
  onChange: (r: { type: string; targetId: number }[]) => void
  characters: Character[]
  excludeId?: number
}) {
  const addRel = () => {
    const type = (document.getElementById('nrt') as HTMLSelectElement).value
    const targetId = parseInt((document.getElementById('nrtg') as HTMLSelectElement).value)
    if (!targetId || rels.find(r => r.targetId === targetId)) return
    onChange([...rels, { type, targetId }])
  }

  return (
    <div>
      <label style={lbl}>Relations</label>
      <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
        <select id="nrt" style={{ ...inp, flex: 1 }}>{REL_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <select id="nrtg" style={{ ...inp, flex: 2 }}>
          {characters.filter(c => c.id !== excludeId).map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.version_id})</option>
          ))}
        </select>
        <button type="button" style={{ ...bS, padding: '8px 12px', flexShrink: 0 }} onClick={addRel}>+</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {rels.map((r, i) => {
          const tc = characters.find(c => c.id === r.targetId)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#1a1824', borderRadius: 8, fontSize: 13, border: '0.5px solid #2a2535' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#2a1040', border: '0.5px solid #4c2d8a', color: '#a78bfa', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>{r.type}</span>
                <span style={{ color: '#e2dff0' }}>{tc?.name || '?'}</span>
              </div>
              <button type="button" style={{ ...bS, padding: '3px 8px', fontSize: 12 }} onClick={() => onChange(rels.filter((_, j) => j !== i))}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Formulaire joueur
type PlayerFormProps = {
  editing: Player | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export function PlayerForm({ editing, onClose, onSubmit }: PlayerFormProps) {
  return (
    <Modal title={editing ? `Modifier — ${editing.pseudo}` : 'Nouveau joueur'} onClose={onClose} maxWidth={400}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {editing
          ? <div><label style={lbl}>Pseudo</label><input value={editing.pseudo} disabled style={{ ...inp, opacity: .4 }} /></div>
          : <div><label style={lbl}>Pseudo</label><input name="pseudo" placeholder="ex: Maxime_B" required style={inp} /></div>
        }
        <div><label style={lbl}>Discord</label><input name="discord" defaultValue={editing?.discord || ''} style={inp} /></div>
        <div><label style={lbl}>TikTok / Instagram</label><input name="tiktok" defaultValue={editing?.tiktok || ''} placeholder="@pseudo" style={inp} /></div>
        <div><label style={lbl}>Lien Twitch / YouTube</label><input name="stream_url" defaultValue={editing?.stream_url || ''} placeholder="https://..." style={inp} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" style={bS} onClick={onClose}>Annuler</button>
          <button type="submit" style={bP}>{editing ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </form>
    </Modal>
  )
}

// Formulaire version
type VersionFormProps = {
  editing: Version | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export function VersionForm({ editing, onClose, onSubmit }: VersionFormProps) {
  return (
    <Modal title={editing ? `Modifier ${editing.id}` : 'Nouvelle version'} onClose={onClose} maxWidth={380}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!editing && <div><label style={lbl}>Identifiant (ex: V5)</label><input name="id" placeholder="V5" required style={inp} /></div>}
        <div><label style={lbl}>Nom affiché</label><input name="label" defaultValue={editing?.label || ''} required style={inp} /></div>
        <div><label style={lbl}>Description</label><input name="description" defaultValue={editing?.description || ''} style={inp} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" style={bS} onClick={onClose}>Annuler</button>
          <button type="submit" style={bP}>{editing ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </form>
    </Modal>
  )
}
