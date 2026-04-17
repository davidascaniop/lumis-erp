'use client'
import { motion } from 'framer-motion'
import { Check, X, Flag, Zap, Heart, MessageCircle, DollarSign, Sparkles } from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════
// COMPARISON TABLE ROWS
// ══════════════════════════════════════════════════════════════════════

type Row = {
  feature: string
  lumis: boolean | string
  excel: boolean | string
  gringos: boolean | string
}

const ROWS: Row[] = [
  {
    feature: 'Tasa BCV automática',
    lumis: true,
    excel: 'Manual, a mano',
    gringos: false,
  },
  {
    feature: 'Facturación en USD y Bs.',
    lumis: true,
    excel: 'A mano',
    gringos: 'Solo USD',
  },
  {
    feature: 'Soporte 100% en español',
    lumis: true,
    excel: false,
    gringos: 'En inglés',
  },
  {
    feature: 'Entiende Venezuela (SENIAT, IGTF)',
    lumis: true,
    excel: false,
    gringos: false,
  },
  {
    feature: 'Precio accesible',
    lumis: '$19.99/mes',
    excel: 'Gratis pero...',
    gringos: '$200-500/mes',
  },
  {
    feature: 'Multi-sucursal',
    lumis: true,
    excel: 'Imposible',
    gringos: true,
  },
  {
    feature: 'Cuentas por cobrar',
    lumis: true,
    excel: 'Cuaderno',
    gringos: true,
  },
  {
    feature: 'Alertas de stock bajo',
    lumis: true,
    excel: false,
    gringos: true,
  },
]

// ══════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════

function Cell({
  value,
  isLumis = false,
}: {
  value: boolean | string
  isLumis?: boolean
}) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
            isLumis
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'bg-emerald-100'
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isLumis ? 'text-white' : 'text-emerald-600'
            }`}
            strokeWidth={3}
          />
        </div>
      </div>
    )
  }

  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" strokeWidth={3} />
        </div>
      </div>
    )
  }

  // String value
  return (
    <div className="text-center">
      <span
        className={`inline-block text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md ${
          isLumis
            ? 'bg-gradient-to-r from-[#EC4899] to-[#A855F7] text-white'
            : 'bg-slate-100 text-slate-500 font-mono'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

export function Differentiator() {
  return (
    <section
      id="por-que-lumis"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.025] pointer-events-none" />
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#A855F7]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-[#EC4899]/5 blur-[120px] rounded-full pointer-events-none" />

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
            <Flag className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[9px] sm:text-[10px] font-bold text-[#A855F7] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              Por qué LUMIS
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight mb-5 text-slate-900 max-w-3xl mx-auto"
          >
            No somos SAP.{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium">
              Somos mejor.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-zilla text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Los sistemas gringos no entienden Venezuela. El Excel no escala.
            LUMIS fue hecho específicamente para tu realidad.
          </motion.p>
        </div>

        {/* ─── 4 PILLARS DE DIFERENCIA ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16 sm:mb-20">
          {[
            {
              icon: Flag,
              title: 'Hecho en Venezuela',
              description:
                'Entendemos BCV, SENIAT, IGTF y la moneda dual. Cada feature nació de un problema real que vive un comerciante venezolano.',
              accent: 'text-[#EC4899]',
              bg: 'from-[#EC4899]/15 to-[#EC4899]/5',
            },
            {
              icon: DollarSign,
              title: 'Precio de aquí',
              description:
                '$19.99/mes vs $200-500 de los sistemas gringos. Mismo poder. Décima parte del precio. Tu margen intacto.',
              accent: 'text-[#A855F7]',
              bg: 'from-[#A855F7]/15 to-[#A855F7]/5',
            },
            {
              icon: Zap,
              title: 'Listo en 10 min',
              description:
                'Sin consultores, sin implementación de 6 meses, sin "contacta a ventas". Te registras, subes tu Excel, y vendes.',
              accent: 'text-[#7C4DFF]',
              bg: 'from-[#7C4DFF]/15 to-[#7C4DFF]/5',
            },
            {
              icon: MessageCircle,
              title: 'Soporte que te entiende',
              description:
                'WhatsApp directo con venezolanos. Sin tickets, sin menús en inglés, sin "press 1 for Spanish". Hablamos tu idioma.',
              accent: 'text-[#6366F1]',
              bg: 'from-[#6366F1]/15 to-[#6366F1]/5',
            },
          ].map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.bg} flex items-center justify-center mb-4 border border-slate-100 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-5 h-5 ${p.accent}`} />
                </div>
                <h3 className="font-outfit font-bold text-lg text-slate-900 mb-2">
                  {p.title}
                </h3>
                <p className="font-zilla text-[14px] text-slate-500 leading-relaxed">
                  {p.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* ─── COMPARISON TABLE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="text-center mb-8">
            <h3 className="font-outfit font-bold text-xl sm:text-2xl text-slate-900 mb-2">
              Comparado con lo que tienes hoy
            </h3>
            <p className="font-zilla text-sm text-slate-500">
              Lo que vas a ganar (y a dejar de sufrir) el día 1
            </p>
          </div>

          <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[2fr_1.2fr_1fr_1fr] border-b-2 border-slate-100">
              <div className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Característica
              </div>
              <div className="px-4 py-4 text-center relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-full shadow-[0_4px_15px_rgba(168,85,247,0.3)]">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    LUMIS
                  </span>
                </div>
              </div>
              <div className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                Excel / Cuaderno
              </div>
              <div className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                Sistemas gringos
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1.2fr_1fr_1fr] border-b border-slate-100 last:border-b-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <div className="px-3 sm:px-6 py-3 sm:py-4 text-[12px] sm:text-sm font-bold text-slate-700 flex items-center">
                  {row.feature}
                </div>
                <div
                  className={`px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-center relative ${
                    row.lumis === true
                      ? 'bg-gradient-to-b from-emerald-50/50 to-transparent'
                      : ''
                  }`}
                >
                  <Cell value={row.lumis} isLumis />
                </div>
                <div className="px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-center">
                  <Cell value={row.excel} />
                </div>
                <div className="px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-center">
                  <Cell value={row.gringos} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile labels — visible only on mobile, above the table */}
          <div className="sm:hidden grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-0 mt-4 text-center">
            <div />
            <div className="text-[8px] font-black text-[#A855F7] uppercase tracking-widest">
              LUMIS
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Excel
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Gringos
            </div>
          </div>
        </motion.div>

        {/* ─── Heart closing message ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 sm:mt-20 text-center"
        >
          <div className="inline-flex items-center gap-2 text-slate-500 mb-3">
            <Heart className="w-4 h-4 text-[#EC4899] fill-[#EC4899]" />
            <span className="font-zilla italic text-sm">
              Hecho por venezolanos, para negocios venezolanos
            </span>
            <Heart className="w-4 h-4 text-[#EC4899] fill-[#EC4899]" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
