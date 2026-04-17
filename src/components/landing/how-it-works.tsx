'use client'
import { motion } from 'framer-motion'
import {
  Sparkles,
  UserPlus,
  Upload,
  Rocket,
  Check,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Package,
  TrendingUp,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════
// MINI VISUALS — uno por paso
// ══════════════════════════════════════════════════════════════════════

function Step1Visual() {
  const steps = [
    { label: 'Empresa', done: true },
    { label: 'Admin', done: true },
    { label: 'Plan', current: true },
    { label: 'Pago', done: false },
  ]
  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          Crea tu cuenta
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider">
            2 min
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  s.done
                    ? 'bg-gradient-to-br from-[#EC4899] to-[#A855F7] border-transparent'
                    : s.current
                    ? 'bg-white border-[#A855F7] ring-4 ring-[#A855F7]/15'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                {s.done ? (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                ) : s.current ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                ) : null}
              </motion.div>
              <span
                className={`text-[8px] font-bold uppercase tracking-wider ${
                  s.done || s.current ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full ${
                  s.done ? 'bg-gradient-to-r from-[#EC4899] to-[#A855F7]' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Step2Visual() {
  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          <Upload className="w-3 h-3 text-[#A855F7]" />
          Carga masiva
        </div>
        <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
          CSV
        </div>
      </div>

      <div className="space-y-1.5">
        {[
          { name: 'Productos', count: 142, done: true },
          { name: 'Clientes', count: 58, done: true },
          { name: 'Proveedores', count: 12, loading: true },
        ].map((row, i) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-2 text-[10px]"
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                row.done ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              {row.done ? (
                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 border-t-transparent"
                />
              )}
            </div>
            <span className="font-bold text-slate-700 flex-1">{row.name}</span>
            <span
              className={`font-mono font-black ${
                row.done ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {row.count} {row.loading ? '…' : '✓'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Step3Visual() {
  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          Ventas hoy
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider">
            LIVE
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-900 truncate">
              Nueva venta · Jenny
            </div>
            <div className="text-[8px] text-slate-500 font-medium">
              hace 3 seg
            </div>
          </div>
          <div className="text-[12px] font-black text-emerald-600 font-mono">
            +$45.30
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-900 truncate">
              Cobro · Paty
            </div>
            <div className="text-[8px] text-slate-500 font-medium">
              hace 12 min
            </div>
          </div>
          <div className="text-[12px] font-black text-[#7C4DFF] font-mono">
            +$80.00
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="pt-1.5 border-t border-slate-100 flex justify-between items-center"
        >
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Total hoy
          </span>
          <span className="text-sm font-black text-slate-900 font-mono">
            $345.20
          </span>
        </motion.div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN — How It Works
// ══════════════════════════════════════════════════════════════════════

type Step = {
  n: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  Visual: React.ComponentType
  accent: string
  accentBg: string
  gradientFrom: string
  gradientTo: string
}

const STEPS: Step[] = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Regístrate en 2 minutos',
    description:
      'Demo gratis de 15 días. Sin tarjeta, sin compromiso. Solo tu correo y una contraseña.',
    Visual: Step1Visual,
    accent: 'text-[#EC4899]',
    accentBg: 'from-[#EC4899]/15 to-[#EC4899]/5',
    gradientFrom: '#EC4899',
    gradientTo: '#A855F7',
  },
  {
    n: '02',
    icon: Package,
    title: 'Carga tu negocio',
    description:
      'Sube tus productos con un Excel. Agrega clientes y personaliza tu moneda. Todo guiado paso a paso.',
    Visual: Step2Visual,
    accent: 'text-[#A855F7]',
    accentBg: 'from-[#A855F7]/15 to-[#A855F7]/5',
    gradientFrom: '#A855F7',
    gradientTo: '#7C4DFF',
  },
  {
    n: '03',
    icon: Rocket,
    title: 'Factura y cobra',
    description:
      'Emite tu primera factura en 30 segundos. Cobra en dólares o bolívares. Ve tu dinero entrar en vivo.',
    Visual: Step3Visual,
    accent: 'text-[#6366F1]',
    accentBg: 'from-[#6366F1]/15 to-[#6366F1]/5',
    gradientFrom: '#7C4DFF',
    gradientTo: '#6366F1',
  },
]

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-white"
    >
      {/* Subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-[#A855F7]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-[#EC4899]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="text-center mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 bg-gradient-to-r from-[#EC4899]/10 to-[#6366F1]/10 border border-[#A855F7]/20"
          >
            <Sparkles className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[9px] sm:text-[10px] font-bold text-[#A855F7] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              Cómo funciona
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight mb-5 text-slate-900 max-w-3xl mx-auto"
          >
            3 pasos y estás{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium">
              vendiendo.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-zilla text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Todo el proceso toma menos de 10 minutos. Sin setup complicado,
            sin consultoría, sin "contacta a ventas".
          </motion.p>
        </div>

        {/* ─── Steps grid ─── */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const { Visual } = step
              return (
                <div key={step.n} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.7, delay: i * 0.15 }}
                    className="relative bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 h-full flex flex-col"
                  >
                    {/* Big number + icon */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div
                          className={`text-[11px] font-black uppercase tracking-[0.2em] mb-1 ${step.accent}`}
                        >
                          Paso {step.n}
                        </div>
                        <div
                          className="text-6xl sm:text-7xl font-black font-outfit leading-none bg-clip-text text-transparent tracking-tight"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${step.gradientFrom}, ${step.gradientTo})`,
                          }}
                        >
                          {step.n}
                        </div>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.accentBg} flex items-center justify-center border border-slate-100`}
                      >
                        <Icon className={`w-6 h-6 ${step.accent}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-outfit font-bold text-xl sm:text-2xl text-slate-900 mb-3 leading-tight">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="font-zilla text-[15px] sm:text-base text-slate-500 leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Visual */}
                    <div className="mt-auto">
                      <Visual />
                    </div>
                  </motion.div>

                  {/* Connector desktop (horizontal) — entre cards */}
                  {i < STEPS.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
                      className="absolute top-[72px] -right-4 z-10 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md"
                    >
                      <ChevronRight
                        className="w-4 h-4 text-slate-400"
                        strokeWidth={3}
                      />
                    </motion.div>
                  )}

                  {/* Connector mobile (vertical) — debajo de cada card menos la última */}
                  {i < STEPS.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
                      className="lg:hidden flex items-center justify-center py-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center">
                        <ChevronDown
                          className="w-4 h-4 text-slate-400"
                          strokeWidth={3}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── CTA final ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 sm:mt-20 text-center"
        >
          <p className="font-zilla text-lg sm:text-xl text-slate-600 mb-6">
            ¿Listo para dejar el cuaderno atrás?
          </p>
          <motion.a
            href="/register"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 sm:px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] shadow-[0_10px_30px_rgba(168,85,247,0.35)] hover:shadow-[0_14px_40px_rgba(168,85,247,0.5)] transition-all font-outfit active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            Empezar gratis 15 días
            <ArrowRight className="w-5 h-5" />
          </motion.a>
          <p className="text-xs font-medium text-slate-400 mt-4">
            Sin tarjeta · Cancela cuando quieras
          </p>
        </motion.div>
      </div>
    </section>
  )
}
