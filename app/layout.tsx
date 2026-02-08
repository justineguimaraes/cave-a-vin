import './globals.css'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'] })

export const metadata = {
  title: 'Cave à vin',
  description: 'Gestion élégante de la cave',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${playfair.className} bg-gradient-to-b from-[#0f0b10] via-[#1a1115] to-[#0f0b10] text-zinc-100`}
      >
        {children}
      </body>
    </html>
  )
}