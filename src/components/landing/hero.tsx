'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { useRef } from 'react'
 
export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, -100])
  const y2 = useTransform(scrollY, [0, 500], [0, -50])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-[64px] pb-20 overflow-hidden bg-[#08050F]"
    >
      {/* ══════════════════════════════════════════
          FONDO — Atmósfera oscura con glow magenta
          ══════════════════════════════════════════ */}
 
      {/* Mesh Gradients Animados */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,64,251,0.15)_0%,transparent_70%)] pointer-events-none blur-3xl"
      />
      
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,77,255,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl"
      />

      {/* Grid de fondo con máscara radial */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(224,64,251,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(224,64,251,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

      {/* Decorative lines */}
      <div className="absolute top-[64px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
 
      {/* ══════════════════════════════════════════
          CONTENIDO
          ══════════════════════════════════════════ */}
 
      <motion.div 
        style={{ opacity }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        {/* BADGE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-brand/5 border border-brand/20 text-brand text-xs font-bold tracking-widest uppercase backdrop-blur-sm"
        >
          <span className="text-sm">⚡</span>
          <span>Hecho para Venezuela</span>
          <span className="text-sm">🇻🇪</span>
        </motion.div>
 
        {/* HEADLINE */}
        <div className="space-y-2 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-black leading-[0.95] tracking-tight text-[64px] md:text-[88px] lg:text-[110px] text-white"
          >
            Vendes mucho.
          </motion.h1>
 
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-display font-black leading-[0.95] tracking-tight text-[64px] md:text-[88px] lg:text-[110px] block"
            style={{
              color: '#E040FB',
              textShadow: '0 0 60px rgba(224,64,251,0.4), 0 0 120px rgba(224,64,251,0.2)',
            }}
          >
            Cobras poco.
          </motion.h1>
 
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-display font-black leading-[0.95] tracking-tight text-[64px] md:text-[88px] lg:text-[110px] text-white/40"
          >
            Y no sabes por qué.
          </motion.h1>
        </div>
 
        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="font-body text-lg md:text-2xl text-[#9585B8] leading-relaxed max-w-2xl mx-auto mb-12"
        >
          Pedidos por WhatsApp, inventario en cuaderno,
          cobros en Excel —{' '}
          <span className="text-white/90 font-medium">
            mientras el BCV cambia y tus clientes
            te deben desde hace meses.
          </span>
          {' '}Así no se escala un negocio.
        </p>
 
        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
        >
          <a
            href="#contacto"
            className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold text-white overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)] transition-opacity" />
            <span className="relative z-10">Solicitar acceso</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
 
          <a
            href="#funciones"
            className="group flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-semibold text-[#9585B8] bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-brand/20 group-hover:border-brand/30 transition-all">
              <Play className="w-3 h-3 ml-0.5 fill-current" />
            </div>
            Ver cómo funciona
          </a>
        </motion.div>
 
        {/* SOCIAL PROOF */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="flex items-center justify-center gap-4 bg-white/[0.02] border border-white/5 py-4 px-8 rounded-2xl inline-flex mx-auto"
        >
          <div className="flex -space-x-3">
            {['C', 'M', 'R', 'A', 'L'].map((initial, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-[#08050F] flex items-center justify-center text-[11px] font-bold text-white shadow-xl"
                style={{
                  background: [
                    'linear-gradient(135deg, #E040FB, #7C4DFF)',
                    'linear-gradient(135deg, #7C4DFF, #4FC3F7)',
                    'linear-gradient(135deg, #00E5CC, #7C4DFF)',
                    'linear-gradient(135deg, #E040FB, #FF2D55)',
                    'linear-gradient(135deg, #FFB800, #E040FB)',
                  ][i]
                }}
              >
                {initial}
              </div>
            ))}
          </div>
 
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.span 
                  autoFocus={false}
                  key={i} 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  className="text-[#FFB800] text-sm"
                >
                  ★
                </motion.span>
              ))}
            </div>
            <p className="text-sm text-[#9585B8]">
              <span className="text-white font-bold">+200 negocios</span>
              {' '}ya automatizaron su flujo
            </p>
          </div>
        </motion.div>
      </motion.div>
 
      {/* ══════════════════════════════════════════
          FLECHA SCROLL DOWN
          ══════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] text-[#9585B8] uppercase tracking-[0.2em] font-bold">
          desliza
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-brand to-transparent" />
      </motion.div>
    </section>
  )
}
