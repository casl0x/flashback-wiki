import { neon } from '@neondatabase/serverless'

// Connexion Neon — utilisée côté serveur uniquement (API routes)
export function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// Types partagés
export type Version = {
  id: string
  label: string
  description: string | null
  created_at?: string
}

export type Player = {
  id: string
  pseudo: string
  discord: string | null
  tiktok: string | null
  stream_url: string | null
  created_at?: string
}

export type Relation = {
  id: number
  character_id: number
  target_id: number
  relation_type: string
  target?: Partial<Character>
}

export type Character = {
  id: number
  name: string
  job: string
  description: string | null
  tags: string[]
  version_id: string
  player_id: string
  created_at?: string
  player?: Player
  version?: Version
  relations?: Relation[]
}
