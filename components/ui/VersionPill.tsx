import { vClass } from '@/lib/utils'

type Props = { version: string }

export default function VersionPill({ version }: Props) {
  return <span className={`vpill ${vClass(version)}`}>{version}</span>
}
