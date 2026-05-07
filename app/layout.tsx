import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flashback WL — Wiki',
  description: 'Répertoire des personnages du serveur RP Flashback WL',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
