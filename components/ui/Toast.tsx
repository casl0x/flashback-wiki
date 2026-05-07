'use client'

type Props = { message: string; type: 'ok' | 'err' }

export default function Toast({ message, type }: Props) {
  return <div className={`toast ${type}`}>{message}</div>
}
