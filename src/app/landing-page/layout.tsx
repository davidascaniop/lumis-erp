import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
 
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})
 
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  weight: ['400', '500', '700'],
})
 
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})
 
export const metadata: Metadata = {
  title: 'LUMIS — El sistema que entiende Venezuela',
  description: 'Centraliza tus pedidos, cartera e inventario con tasa BCV en tiempo real.',
}
 
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body
        className={`
          ${syne.variable}
          ${dmSans.variable}
          ${jetbrainsMono.variable}
          font-sans bg-[#08050F] text-[#F4EDFF] antialiased overflow-x-hidden
        `}
      >
        {children}
      </body>
    </html>
  )
}
