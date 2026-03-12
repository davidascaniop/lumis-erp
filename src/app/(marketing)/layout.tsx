import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LUMIS — El ERP que entiende el dólar, el BCV y tu cartera',
  description: 'Sistema ERP/CRM para distribuidoras venezolanas. Pedidos, inventario, cobranza y tasa BCV en tiempo real.',
  openGraph: {
    title: 'LUMIS — ERP para distribuidoras venezolanas',
    description: 'Centraliza pedidos, inventario y cobranza con tasa BCV automática.',
    type: 'website',
  }
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#08050F] min-h-screen overflow-x-hidden">
      {children}
    </div>
  )
}
