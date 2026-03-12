import type { Metadata } from 'next'
import { Outfit, Zilla_Slab } from 'next/font/google'
import '../globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
})

const zilla = Zilla_Slab({
  subsets: ['latin'],
  variable: '--font-zilla',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'LUMIS — El CRM/ERP que entiende Venezuela',
  description: 'Centraliza tus pedidos, cartera e inventario con tasa BCV en tiempo real.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${outfit.variable} ${zilla.variable} font-sans bg-[#08050F] text-[#F4EDFF] antialiased`}>
      {children}
    </div>
  )
}
