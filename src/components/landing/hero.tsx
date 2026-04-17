'use client'
import { motion } from 'framer-motion'
import {
  Sparkles,
  CreditCard,
  Languages,
  TrendingUp,
  Check,
  ShoppingCart,
  DollarSign,
  Package,
} from 'lucide-react'

// ─── WhatsApp icon (lucide no lo trae) ────────────────────────────────
function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#25D366"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

// ─── Dashboard Mockup (CSS puro, sin dependencia de imagen) ────────────
function DashboardMockup() {
  const chartBars = [30, 48, 25, 60, 85, 68, 92, 78, 95, 70, 88, 100]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
      className="relative w-full"
    >
      {/* Browser chrome */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Top bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-[10px] text-slate-500 font-mono">
              uselumisapp.com/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex bg-slate-50 h-[420px]">
          {/* Mini sidebar */}
          <div className="w-[130px] bg-white border-r border-slate-200 p-3 hidden sm:flex flex-col shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center text-white text-xs font-black">
                L
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-900 leading-none">
                  LUMIS
                </div>
                <div className="text-[8px] text-slate-400 tracking-widest font-bold mt-0.5">
                  ERP · CRM
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md mb-3">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-700">
                  BCV: Bs.500/$
                </span>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm">
              + Nueva venta
            </button>

            <div className="mt-3 space-y-1">
              <div className="px-2 py-1.5 bg-[#E040FB]/10 text-[#E040FB] text-[10px] font-bold rounded-md flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#E040FB]" />
                Dashboard
              </div>
              {['Ventas', 'Compras', 'Inventario', 'Finanzas', 'CRM'].map((item) => (
                <div
                  key={item}
                  className="px-2 py-1.5 text-slate-500 text-[10px] font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Greeting + period toggle */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-black text-slate-900">
                  ¡Buenas tardes, David! 👋
                </div>
                <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                  Viernes, 17 de Abril 2026
                </div>
              </div>
              <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5">
                <div className="px-2 py-0.5 text-[9px] text-slate-400 font-medium rounded">
                  Hoy
                </div>
                <div className="px-2 py-0.5 text-[9px] text-slate-400 font-medium rounded">
                  Semana
                </div>
                <div className="px-2 py-0.5 bg-[#E040FB] text-white text-[9px] font-bold rounded">
                  Mes
                </div>
                <div className="px-2 py-0.5 text-[9px] text-slate-400 font-medium rounded">
                  Año
                </div>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                {
                  icon: DollarSign,
                  label: 'Por cobrar',
                  value: '$11.57',
                  bg: 'bg-[#E040FB]/10',
                  color: 'text-[#E040FB]',
                },
                {
                  icon: TrendingUp,
                  label: 'Ventas mes',
                  value: '$2,608',
                  bg: 'bg-emerald-100',
                  color: 'text-emerald-600',
                },
                {
                  icon: ShoppingCart,
                  label: 'Pedidos activos',
                  value: '4',
                  bg: 'bg-amber-100',
                  color: 'text-amber-600',
                },
              ].map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.label}
                    className="bg-white border border-slate-200 rounded-lg p-2.5"
                  >
                    <div
                      className={`w-6 h-6 rounded-md ${card.bg} flex items-center justify-center mb-1.5`}
                    >
                      <Icon className={`w-3 h-3 ${card.color}`} />
                    </div>
                    <div className="text-base font-black text-slate-900 leading-none">
                      {card.value}
                    </div>
                    <div className="text-[8px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                      {card.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Chart card */}
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-[10px] font-black text-slate-900">
                    Ventas por Mes
                  </div>
                  <div className="text-[8px] text-slate-400 font-medium">
                    Facturación total en USD
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#E040FB]">
                    $2,608.88
                  </div>
                  <div className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-2.5 h-2.5" />
                    +12.4%
                  </div>
                </div>
              </div>
              <div className="h-[110px] flex items-end gap-1 mt-2">
                {chartBars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.8 + i * 0.05,
                      ease: 'easeOut',
                    }}
                    style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                    className="flex-1 bg-gradient-to-t from-[#E040FB] to-[#7C4DFF] rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card — "Antes" (el cuaderno) */}
      <motion.div
        initial={{ opacity: 0, x: -30, rotate: -8, y: 10 }}
        animate={{ opacity: 1, x: 0, rotate: -6, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute -left-4 -bottom-8 bg-[#FEF9C3] border border-amber-200 rounded-lg px-4 py-3 shadow-xl max-w-[220px] hidden sm:block"
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent 0, transparent 18px, rgba(0,0,0,0.08) 19px)',
        }}
      >
        <div className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1">
          📓 Antes (en cuaderno)
        </div>
        <div className="text-xs text-slate-800 font-zilla italic leading-relaxed">
          &quot;Sra. María — $120, pagó 60, debe 60. Dios mío se me olvida
          cobrarle…&quot;
        </div>
      </motion.div>

      {/* Floating card — "Ahora" (check verde) */}
      <motion.div
        initial={{ opacity: 0, x: 30, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="absolute -right-3 -top-5 bg-white border border-emerald-200 rounded-xl px-4 py-3 shadow-2xl hidden sm:flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
        </div>
        <div>
          <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
            Ahora con LUMIS
          </div>
          <div className="text-xs font-black text-slate-900">
            Todo en 1 clic ✨
          </div>
        </div>
      </motion.div>

      {/* Floating pill — inventory badge (medio arriba derecha) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.7 }}
        className="absolute right-6 top-1/3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-lg hidden lg:flex items-center gap-2"
      >
        <Package className="w-3 h-3 text-[#7C4DFF]" />
        <span className="text-[10px] font-bold text-slate-700">
          Stock sincronizado
        </span>
      </motion.div>
    </motion.div>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────────
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-white">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E040FB]/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#7C4DFF]/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center">
        {/* ─── LEFT · Copy ─── */}
        <div className="text-center lg:text-left">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-gradient-to-r from-[#E040FB]/8 to-[#7C4DFF]/8 border border-[#E040FB]/15 backdrop-blur-sm"
          >
            <span className="text-[10px] font-bold text-[#E040FB] tracking-[0.18em] uppercase font-outfit">
              🇻🇪 Hecho en Venezuela · Desde $19.99/mes
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-outfit font-bold text-[40px] sm:text-[48px] md:text-[56px] lg:text-[60px] leading-[1.05] tracking-tight mb-6">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-slate-900 block"
            >
              El cuaderno de tu abuela
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-slate-900 block"
            >
              cumplió su misión.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="bg-gradient-to-r from-[#E040FB] via-[#B266FF] to-[#7C4DFF] bg-clip-text text-transparent font-zilla italic font-medium block"
            >
              Ahora vas tú.
            </motion.span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-zilla text-base md:text-lg lg:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
          >
            LUMIS digitaliza tu negocio sin que dejes de ser tú. Factura en{' '}
            <span className="text-slate-800 font-semibold">
              dólares o bolívares
            </span>
            , cobra a crédito con{' '}
            <span className="text-slate-800 font-semibold">cuentas claras</span>{' '}
            y controla tu{' '}
            <span className="text-slate-800 font-semibold">inventario</span> —
            todo en un solo lugar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="flex flex-col sm:flex-row gap-3 mb-7 justify-center lg:justify-start"
          >
            <motion.a
              href="/register"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] shadow-[0_10px_30px_rgba(224,64,251,0.35)] hover:shadow-[0_14px_40px_rgba(224,64,251,0.5)] transition-all font-outfit"
            >
              <Sparkles className="w-5 h-5" />
              Empezar gratis 15 días
            </motion.a>
            <motion.a
              href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20quiero%20info"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all font-outfit"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Hablar por WhatsApp
            </motion.a>
          </motion.div>

          {/* Micro-proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 justify-center lg:justify-start"
          >
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              Sin tarjeta para probar
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              BCV automático
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              100% en español
            </span>
          </motion.div>
        </div>

        {/* ─── RIGHT · Dashboard mockup ─── */}
        <div className="relative">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}
