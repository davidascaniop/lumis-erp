'use client'
import { motion } from 'framer-motion'
import {
  DollarSign,
  NotebookText,
  PackageSearch,
  EyeOff,
  MessageSquareMore,
  UserX,
  ArrowDown,
} from 'lucide-react'

type PainCard = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  quote: string
  accent: string
  accentBg: string
}

const CARDS: PainCard[] = [
  {
    icon: DollarSign,
    label: 'El dólar caprichoso',
    quote: '"¿A qué tasa te lo cobro? Déjame chequear el BCV otra vez..."',
    accent: 'text-[#EC4899]',
    accentBg: 'from-[#EC4899]/15 to-[#EC4899]/5',
  },
  {
    icon: NotebookText,
    label: 'Cuentas fiadas perdidas',
    quote: '"¿Cuánto me debe la Sra. María? Busco el cuaderno..."',
    accent: 'text-[#A855F7]',
    accentBg: 'from-[#A855F7]/15 to-[#A855F7]/5',
  },
  {
    icon: PackageSearch,
    label: 'Stock fantasma',
    quote: '"Creo que quedan como 5... voy a revisar al depósito."',
    accent: 'text-[#7C4DFF]',
    accentBg: 'from-[#7C4DFF]/15 to-[#7C4DFF]/5',
  },
  {
    icon: EyeOff,
    label: 'Ventas ciegas',
    quote: '"No sabemos cuánto vendimos hoy hasta que cerremos caja."',
    accent: 'text-[#6366F1]',
    accentBg: 'from-[#6366F1]/15 to-[#6366F1]/5',
  },
  {
    icon: MessageSquareMore,
    label: 'WhatsApp convertido en ERP',
    quote: '"Tengo 17 chats sin procesar entre 3 celulares diferentes..."',
    accent: 'text-[#0EA5E9]',
    accentBg: 'from-[#0EA5E9]/15 to-[#0EA5E9]/5',
  },
  {
    icon: UserX,
    label: 'Vendedor sin memoria',
    quote: '"A Carla le doy 5% de descuento. ¿O era 10? No me acuerdo..."',
    accent: 'text-[#F59E0B]',
    accentBg: 'from-[#F59E0B]/15 to-[#F59E0B]/5',
  },
]

export function Problem() {
  return (
    <section
      id="problema"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white"
    >
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.025] pointer-events-none" />

      {/* Subtle glows */}
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-[#EC4899]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-[#6366F1]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="text-center mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 bg-slate-100 border border-slate-200"
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              ¿Te suena familiar?
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight mb-5 text-slate-900 max-w-3xl mx-auto"
          >
            Tu día a día está lleno
            <br />
            de momentos{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium">
              como estos.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-zilla text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            No estás solo. Cada PyME venezolana vive lo mismo.
            <br className="hidden sm:block" />
            La diferencia es que tú, desde hoy, tienes una salida.
          </motion.p>
        </div>

        {/* ─── Grid de cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-14 sm:mb-20">
          {CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${card.accentBg} flex items-center justify-center mb-5 border border-slate-100 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.accent}`} />
                </div>

                {/* Label */}
                <div
                  className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] mb-3 ${card.accent}`}
                >
                  {card.label}
                </div>

                {/* Quote */}
                <p className="font-zilla italic text-[15px] sm:text-base lg:text-[17px] text-slate-700 leading-snug sm:leading-relaxed relative z-10">
                  {card.quote}
                </p>

                {/* Subtle corner accent on hover */}
                <div
                  className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${card.accentBg} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />
              </motion.div>
            )
          })}
        </div>

        {/* ─── Outro / bridge a la siguiente sección ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-4">
            <p className="font-zilla text-lg sm:text-xl lg:text-2xl text-slate-700 max-w-2xl leading-snug px-4">
              Si te identificaste con{' '}
              <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-semibold italic">
                dos o más
              </span>
              {' '}de estos, LUMIS es para ti.
            </p>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC4899] via-[#A855F7] to-[#6366F1] flex items-center justify-center shadow-lg"
            >
              <ArrowDown className="w-5 h-5 text-white" strokeWidth={3} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
