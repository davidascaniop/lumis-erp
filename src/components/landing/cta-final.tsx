'use client'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Zap,
} from 'lucide-react'

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export function CTAFinal() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-white">
      {/* Animated gradient glows — softer than dark version */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#EC4899]/12 blur-[140px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#6366F1]/12 blur-[140px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A855F7]/10 blur-[160px] rounded-full pointer-events-none"
      />

      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.035] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-gradient-to-r from-[#EC4899]/10 to-[#6366F1]/10 border border-[#A855F7]/25 backdrop-blur-sm shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-[#A855F7]" />
          <span className="text-[10px] sm:text-[11px] font-bold text-[#A855F7] tracking-[0.2em] uppercase font-outfit">
            El momento es ahora
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-outfit font-bold text-[40px] sm:text-[56px] md:text-[72px] lg:text-[88px] leading-[1.02] tracking-tight mb-6 text-slate-900"
        >
          Tu negocio{' '}
          <span className="inline-block bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium pr-2">
            cambia
          </span>
          <br />
          el día que{' '}
          <span className="inline-block bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium pr-2">
            tú
          </span>{' '}
          decidas.
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="font-zilla text-lg sm:text-xl lg:text-2xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          15 días gratis para dejar de improvisar. Sin tarjeta, sin compromiso,
          sin excusas. El cuaderno ya cumplió —{' '}
          <span className="text-slate-900 font-semibold">ahora vas tú.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10"
        >
          <motion.a
            href="/register"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-xl text-base sm:text-lg font-black text-white bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] shadow-[0_10px_40px_rgba(168,85,247,0.35)] hover:shadow-[0_14px_50px_rgba(168,85,247,0.5)] transition-all font-outfit active:scale-95 overflow-hidden"
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
            />
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Empezar mi demo gratis</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.a>

          <motion.a
            href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20quiero%20info"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-xl text-base sm:text-lg font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all font-outfit active:scale-95"
          >
            <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
            Hablar por WhatsApp
          </motion.a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-slate-500 font-medium"
        >
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            Sin tarjeta para probar
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Cancela cuando quieras
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Listo en 10 minutos
          </span>
        </motion.div>

        {/* Decorative "15 días" huge text bg */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.05 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.8 }}
          className="absolute inset-x-0 bottom-0 text-center pointer-events-none select-none overflow-hidden"
        >
          <div className="font-outfit font-black text-[20vw] leading-none bg-gradient-to-b from-[#A855F7] to-transparent bg-clip-text text-transparent tracking-tighter">
            15 DÍAS
          </div>
        </motion.div>
      </div>
    </section>
  )
}
