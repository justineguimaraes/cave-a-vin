import './globals.css'
import { Playfair_Display } from 'next/font/google'
import { PWAClient } from './pwa-client' // ✅ enregistre le SW côté client

const playfair = Playfair_Display({ subsets: ['latin'] })

export const metadata = {
  title: 'Cave à vin',
  description: 'Gestion élégante de la cave',
  // ✅ Déclaration PWA
  manifest: '/manifest.json',
  themeColor: '#7b2d26',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    // iOS attend apple-touch-icon pour l'icône d’écran d’accueil
    apple: [{ url: '/icons/icon-192.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${playfair.className} bg-gradient-to-b from-[#0f0b10] via-[#1a1115] to-[#0f0b10] text-zinc-100`}>
        {/* ⚡ Enregistre le Service Worker au premier chargement côté navigateur */}
        <PWAClient />
        {children}
      </body>
    </html>
  )
}