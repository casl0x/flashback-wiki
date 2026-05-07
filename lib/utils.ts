// Palettes avatar par nom
const AVATARS = [
  ['#1a2540', '#60a5fa', '#1e3a6e'],
  ['#1a2e1a', '#4ade80', '#1a4a1a'],
  ['#2e1a10', '#fb923c', '#4a2a10'],
  ['#2a1040', '#a78bfa', '#4c2d8a'],
  ['#1e1530', '#c084fc', '#5b21b6'],
  ['#102030', '#38bdf8', '#0e4a6e'],
]

export function pColor(name: string): [string, string, string] {
  const i = ((name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)) % AVATARS.length
  return AVATARS[i] as [string, string, string]
}

export function ini(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

export function vClass(v: string): string {
  return ({ V1: 'v1b', V2: 'v2b', V3: 'v3b', V4: 'v4b' } as Record<string, string>)[v] || 'v4b'
}

export function vBadgeBg(id: string): string {
  return ({ V1: '#1a2540', V2: '#1a2e1a', V3: '#2e1a10', V4: '#2a1040' } as Record<string, string>)[id] || '#1e1530'
}

export function vBadgeFg(id: string): string {
  return ({ V1: '#60a5fa', V2: '#4ade80', V3: '#fb923c', V4: '#a78bfa' } as Record<string, string>)[id] || '#a78bfa'
}
