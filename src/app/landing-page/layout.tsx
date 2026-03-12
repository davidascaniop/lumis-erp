import type { Metadata } from 'next'

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
    <div className="bg-[#08050F] text-[#F4EDFF] antialiased">
      {children}
    </div>
  )
}
