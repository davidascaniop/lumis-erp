'use client'
import { motion } from 'framer-motion'
import {
  Receipt,
  Package,
  Users,
  TrendingUp,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Search,
  Phone,
  Mail,
  FileText,
  Sparkles,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════
// MOCKUP 1 — VENTAS (Nueva venta con BCV automático)
// ══════════════════════════════════════════════════════════════════════
function VentaMockup() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              Nueva venta
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              #PED-2026-0142
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700">
              BCV: Bs. 500.00
            </span>
          </div>
        </div>

        {/* Cliente */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            Cliente
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
              JR
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Jenny — Farmacia Rosal
              </div>
              <div className="text-[9px] text-slate-400 font-medium">
                J-30456789-0
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-3 space-y-2">
          {[
            { name: 'Paracetamol 500mg x20', qty: 3, price: 4.5 },
            { name: 'Amoxicilina 500mg x30', qty: 2, price: 8.9 },
            { name: 'Vitamina C 1000mg', qty: 1, price: 13.9 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center justify-between text-[11px]"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-700 truncate">
                  {item.name}
                </div>
                <div className="text-slate-400 text-[9px]">× {item.qty}</div>
              </div>
              <div className="font-bold text-slate-900 font-mono tabular-nums">
                ${(item.qty * item.price).toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-3">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Total
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Bs. 22,650.00
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-600 font-mono tabular-nums">
                $45.30
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 py-3 bg-white">
          <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-black py-2.5 rounded-xl shadow-sm">
            Facturar venta
          </button>
        </div>
      </div>

      {/* Floating pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="absolute -top-3 -right-2 sm:-right-4 bg-white border border-emerald-200 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
      >
        <Sparkles className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-black text-slate-700">
          Tasa sincronizada
        </span>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MOCKUP 2 — INVENTARIO (stock en tiempo real con alertas)
// ══════════════════════════════════════════════════════════════════════
function InventarioMockup() {
  const products = [
    { name: 'Harina PAN 1kg', sku: 'ALM-001', stock: 120, max: 200, status: 'ok' },
    { name: 'Arroz Mary 1kg', sku: 'ALM-002', stock: 8, max: 100, status: 'low' },
    { name: 'Aceite Mazeite 1L', sku: 'ALM-003', stock: 45, max: 80, status: 'ok' },
    { name: 'Azúcar refinada 1kg', sku: 'ALM-004', stock: 3, max: 80, status: 'low' },
    { name: 'Pasta capellini', sku: 'ALM-005', stock: 67, max: 100, status: 'ok' },
  ]

  return (
    <div className="relative">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-[#7C4DFF] uppercase tracking-widest">
              Inventario
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              Depósito Principal
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
            <Search className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] text-slate-400">Buscar</span>
          </div>
        </div>

        {/* Products */}
        <div className="px-4 py-3 space-y-2.5">
          {products.map((p, i) => (
            <motion.div
              key={p.sku}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                p.status === 'low'
                  ? 'bg-red-50 border border-red-100'
                  : 'bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  p.status === 'low' ? 'bg-red-100' : 'bg-slate-100'
                }`}
              >
                <Package
                  className={`w-4 h-4 ${
                    p.status === 'low' ? 'text-red-500' : 'text-slate-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">
                  {p.name}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {p.sku}
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(p.stock / p.max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className={`h-full rounded-full ${
                      p.status === 'low'
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : 'bg-gradient-to-r from-[#A855F7] to-[#7C4DFF]'
                    }`}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`text-sm font-black font-mono tabular-nums ${
                    p.status === 'low' ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {p.stock}
                </div>
                <div className="text-[8px] text-slate-400 font-bold uppercase">
                  unidades
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating alert */}
      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 3 }}
        whileInView={{ opacity: 1, x: 0, rotate: 3 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="absolute -bottom-4 -right-2 sm:-right-4 bg-white border border-red-200 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <div className="text-[9px] text-red-600 font-black uppercase tracking-widest">
            Alerta
          </div>
          <div className="text-[11px] font-black text-slate-900">
            2 productos por agotarse
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MOCKUP 3 — CLIENTES (ficha con historial y cobranza)
// ══════════════════════════════════════════════════════════════════════
function ClientesMockup() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header with client info */}
        <div className="px-5 py-4 bg-gradient-to-br from-[#EC4899]/5 via-white to-white border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] flex items-center justify-center text-white text-base font-black">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-slate-900">
                Paty — Boutique Central
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                J-31245678-9
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-200">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  Al día
                </span>
                <span className="text-[9px] text-slate-400 font-bold">
                  Cliente VIP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[9px] text-slate-400 font-medium">
            <Phone className="w-3 h-3" />
            <span>+58 414-5553210</span>
            <span className="text-slate-300">·</span>
            <Mail className="w-3 h-3" />
            <span>paty@boutique...</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { label: 'Debe', value: '$340', color: 'text-[#EC4899]' },
            { label: 'Compras', value: '27', color: 'text-slate-900' },
            { label: 'Límite', value: '$800', color: 'text-slate-900' },
          ].map((s) => (
            <div key={s.label} className="px-3 py-3 text-center">
              <div className={`text-base font-black font-mono ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Credit bar */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            <span>Crédito usado</span>
            <span className="text-slate-900">42%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '42%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-full"
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="px-5 py-3">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Últimos movimientos
          </div>
          <div className="space-y-2">
            {[
              { type: 'Venta', amount: '+$145', date: 'Hoy', positive: true },
              { type: 'Abono', amount: '+$80', date: 'Ayer', positive: true },
              { type: 'Venta', amount: '+$220', date: 'Lun 14', positive: false },
            ].map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center justify-between text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-slate-700">{a.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{a.date}</span>
                  <span
                    className={`font-black font-mono ${
                      a.positive ? 'text-emerald-600' : 'text-[#EC4899]'
                    }`}
                  >
                    {a.amount}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <button className="w-full bg-gradient-to-r from-[#EC4899] to-[#A855F7] text-white text-xs font-black py-2.5 rounded-xl shadow-sm">
            Registrar abono
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MOCKUP 4 — FINANZAS (dashboard de ganancias)
// ══════════════════════════════════════════════════════════════════════
function FinanzasMockup() {
  const chartData = [40, 55, 48, 70, 65, 82, 75, 90, 85, 95, 88, 100]

  return (
    <div className="relative">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-[#6366F1] uppercase tracking-widest">
              Finanzas
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              Resumen del mes
            </div>
          </div>
          <div className="flex gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <div className="px-2 py-0.5 text-[9px] text-slate-400 font-medium">
              Semana
            </div>
            <div className="px-2 py-0.5 bg-[#6366F1] text-white text-[9px] font-black rounded">
              Mes
            </div>
            <div className="px-2 py-0.5 text-[9px] text-slate-400 font-medium">
              Año
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {[
            {
              label: 'Ingresos',
              value: '$12,450',
              change: '+18%',
              positive: true,
              bg: 'bg-emerald-50',
              color: 'text-emerald-600',
              borderColor: 'border-emerald-100',
            },
            {
              label: 'Gastos',
              value: '$4,180',
              change: '-5%',
              positive: true,
              bg: 'bg-rose-50',
              color: 'text-rose-500',
              borderColor: 'border-rose-100',
            },
            {
              label: 'Utilidad',
              value: '$8,270',
              change: '+24%',
              positive: true,
              bg: 'bg-[#6366F1]/10',
              color: 'text-[#6366F1]',
              borderColor: 'border-[#6366F1]/20',
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} ${s.borderColor} border rounded-xl p-2.5`}
            >
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {s.label}
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {s.value}
              </div>
              <div
                className={`flex items-center gap-0.5 text-[9px] font-black mt-0.5 ${s.color}`}
              >
                {s.positive ? (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                )}
                {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="px-5 py-3 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-[10px] font-black text-slate-900">
                Utilidad neta
              </div>
              <div className="text-[8px] text-slate-400 font-medium">
                Últimos 12 meses · USD
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-[#6366F1] font-mono">
                $8,270
              </div>
            </div>
          </div>
          <div className="h-[90px] flex items-end gap-1">
            {chartData.map((h, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.4 + i * 0.05,
                  ease: 'easeOut',
                }}
                style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                className={`flex-1 rounded-t-sm ${
                  i === chartData.length - 1
                    ? 'bg-gradient-to-t from-[#6366F1] to-[#A855F7]'
                    : 'bg-[#6366F1]/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating change */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="absolute -top-3 -left-2 sm:-left-4 bg-white border border-emerald-200 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
            vs. mes pasado
          </div>
          <div className="text-xs font-black text-slate-900">
            +24% ganancia
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN — Solution Showcase
// ══════════════════════════════════════════════════════════════════════

type Pillar = {
  label: string
  title: React.ReactNode
  description: string
  bullets: string[]
  icon: React.ComponentType<{ className?: string }>
  Mockup: React.ComponentType
  accent: string
  accentBg: string
  mockupLeft: boolean
}

const PILLARS: Pillar[] = [
  {
    label: 'Ventas',
    title: (
      <>
        Factura en dólares o bolívares.{' '}
        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-zilla italic font-medium">
          Sin pensar.
        </span>
      </>
    ),
    description:
      'La tasa BCV se sincroniza sola con el API oficial. Tu cliente ve el precio en la moneda que él quiere. Tú cobras y listo.',
    bullets: [
      'Facturación en USD y Bs. al instante',
      'Tasa BCV automática vía API del Banco Central',
      'Pedidos desde WhatsApp convertidos a venta',
      'PDF descargable e impresión fiscal',
    ],
    icon: Receipt,
    Mockup: VentaMockup,
    accent: 'text-emerald-600',
    accentBg: 'from-emerald-500/15 to-emerald-500/5',
    mockupLeft: false,
  },
  {
    label: 'Inventario',
    title: (
      <>
        Nunca más el{' '}
        <span className="bg-gradient-to-r from-[#A855F7] to-[#7C4DFF] bg-clip-text text-transparent font-zilla italic font-medium">
          "creo que quedan como 5".
        </span>
      </>
    ),
    description:
      'Cada venta descuenta stock automáticamente. Alertas cuando un producto está por acabarse. Multi-depósito si tienes varias sucursales.',
    bullets: [
      'Stock en tiempo real, sincronizado con ventas',
      'Alertas automáticas de bajo stock',
      'Multi-depósito / sucursales',
      'Kits y combos con componentes dinámicos',
    ],
    icon: Package,
    Mockup: InventarioMockup,
    accent: 'text-[#7C4DFF]',
    accentBg: 'from-[#A855F7]/15 to-[#7C4DFF]/5',
    mockupLeft: true,
  },
  {
    label: 'Clientes y Cobranza',
    title: (
      <>
        Nunca más pierdas una{' '}
        <span className="bg-gradient-to-r from-[#EC4899] to-[#A855F7] bg-clip-text text-transparent font-zilla italic font-medium">
          cuenta fiada.
        </span>
      </>
    ),
    description:
      'Cada cliente tiene su ficha con historial, saldo pendiente, días de crédito y score de riesgo. Recordatorios de cobro automáticos.',
    bullets: [
      'Ficha detallada por cliente',
      'Cuentas por cobrar con fecha y monto',
      'Recordatorios automáticos por WhatsApp',
      'Score de riesgo crediticio en vivo',
    ],
    icon: Users,
    Mockup: ClientesMockup,
    accent: 'text-[#EC4899]',
    accentBg: 'from-[#EC4899]/15 to-[#EC4899]/5',
    mockupLeft: false,
  },
  {
    label: 'Finanzas',
    title: (
      <>
        Sabe exactamente{' '}
        <span className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] bg-clip-text text-transparent font-zilla italic font-medium">
          cuánto ganaste este mes.
        </span>
      </>
    ),
    description:
      'Flujo de caja en vivo. Múltiples cuentas bancarias. Ganancia neta calculada automáticamente. Reportes que puedes exportar a PDF.',
    bullets: [
      'Flujo de caja actualizado al segundo',
      'Múltiples cuentas (USD, Bs., digital, efectivo)',
      'Costos fijos y variables separados',
      'Reportes exportables a PDF y Excel',
    ],
    icon: TrendingUp,
    Mockup: FinanzasMockup,
    accent: 'text-[#6366F1]',
    accentBg: 'from-[#6366F1]/15 to-[#6366F1]/5',
    mockupLeft: true,
  },
]

function Row({ pillar, index }: { pillar: Pillar; index: number }) {
  const { Mockup, icon: Icon, mockupLeft } = pillar
  const fromLeft = index % 2 === 0 // alternating backgrounds

  return (
    <div
      className={`relative py-16 sm:py-20 lg:py-28 ${
        fromLeft ? 'bg-white' : 'bg-slate-50/50'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div
          className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
            mockupLeft ? 'lg:grid-flow-col-dense' : ''
          }`}
        >
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: mockupLeft ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className={mockupLeft ? 'lg:col-start-2' : ''}
          >
            {/* Icon + label */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillar.accentBg} flex items-center justify-center border border-slate-100`}
              >
                <Icon className={`w-5 h-5 ${pillar.accent}`} />
              </div>
              <div
                className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] ${pillar.accent}`}
              >
                {pillar.label}
              </div>
            </div>

            {/* Title */}
            <h3 className="font-outfit font-bold text-[28px] sm:text-[34px] md:text-[40px] leading-[1.1] tracking-tight mb-5 text-slate-900">
              {pillar.title}
            </h3>

            {/* Description */}
            <p className="font-zilla text-base sm:text-lg text-slate-500 leading-relaxed mb-6">
              {pillar.description}
            </p>

            {/* Bullets */}
            <ul className="space-y-2.5">
              {pillar.bullets.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3 text-sm sm:text-[15px] text-slate-700"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-to-br ${pillar.accentBg} flex items-center justify-center shrink-0 mt-0.5 border border-slate-100`}
                  >
                    <Check
                      className={`w-3 h-3 ${pillar.accent}`}
                      strokeWidth={3}
                    />
                  </div>
                  <span className="font-medium">{b}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, x: mockupLeft ? -30 : 30, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className={mockupLeft ? 'lg:col-start-1 lg:row-start-1' : ''}
          >
            <Mockup />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export function ProductShowcase() {
  return (
    <section id="funciones" className="relative overflow-hidden">
      {/* Section header */}
      <div className="relative bg-white py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.025] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#A855F7]/10 to-transparent blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 bg-gradient-to-r from-[#E040FB]/8 to-[#7C4DFF]/8 border border-[#E040FB]/15"
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-[#E040FB] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              Con LUMIS se acaba
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight text-slate-900 mb-5 max-w-3xl mx-auto"
          >
            Todo lo que tu negocio
            <br />
            necesita{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium">
              en un solo lugar.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-zilla text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            4 módulos diseñados para que dejes de hacer malabares entre apps,
            cuadernos y chats. Todo conectado. Todo en vivo. Todo tuyo.
          </motion.p>
        </div>
      </div>

      {/* Rows */}
      {PILLARS.map((pillar, i) => (
        <Row key={pillar.label} pillar={pillar} index={i} />
      ))}
    </section>
  )
}
