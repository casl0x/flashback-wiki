import { pColor, ini } from '@/lib/utils'

type Props = {
  name: string
  size?: number
  fontSize?: number
  style?: React.CSSProperties
}

export default function Avatar({ name, size = 36, fontSize = 13, style }: Props) {
  const [bg, fg, bd] = pColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg, border: `1.5px solid ${bd}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif", fontSize, fontWeight: 700,
      flexShrink: 0, ...style,
    }}>
      {ini(name)}
    </div>
  )
}
