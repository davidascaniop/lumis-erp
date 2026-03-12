import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import '@/app/globals.css'

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['700', '800']
})

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600']
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'LUMIS — El ERP que entiende el dólar y tu cartera',
  description: 'Gestión inteligente para negocios venezolanos. Inventario, pedidos y cobranza en un solo lugar.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} font-body bg-[#08050F] text-[#F4EDFF] antialiased`}>
      {children}
    </div>
  )
}
