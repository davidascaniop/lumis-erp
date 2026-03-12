'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Play } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Sutil movimiento de subida pero menos agresivo para mantener visibilidad
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.98])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center
                        pt-32 pb-24 overflow-hidden"
    >

      {/* Fondo con glow animado sutil */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <motion.div 
          animate={{ opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[800px] rounded-full
                        bg-[radial-gradient(circle,rgba(224,64,251,0.1)_0%,transparent_70%)] blur-3xl" 
        />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
               backgroundSize: '80px 80px'
             }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">

        {/* Badge minimal */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8
                        bg-white/[0.03] border border-white/10 backdrop-blur-sm"
        >
          <Zap className="w-3.5 h-3.5 text-[#E040FB]" />
          <span className="text-xs font-bold text-[#9585B8] tracking-wider uppercase">
             Hecho para Venezuela 🇻🇪
          </span>
        </motion.div>

        {/* Headline minimalista */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white
                         leading-[1.15] tracking-tight mb-6"
        >
          Gestión inteligente de
          <br />
          <span className="text-[#E040FB]">pedidos y cobranza.</span>
        </motion.h1>

        {/* Subheadline minimalista */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base md:text-lg text-[#9585B8] max-w-xl mx-auto mb-10
                      leading-relaxed font-body font-normal opacity-80"
        >
          LUMIS centraliza tu inventario y cartera en un solo lugar. 
          Con tasa BCV automática y portal de pago para tus clientes.
        </motion.p>

        {/* CTAs refinados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <motion.a 
            href="https://wa.me/584240000000"
            target="_blank"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-xl text-base font-bold
                        text-white bg-[#E040FB] shadow-[0_10px_30px_rgba(224,64,251,0.2)]
                        transition-all duration-300"
          >
            Empezar Gratis
          </motion.a>
          
          <motion.a 
            href="#funciones"
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
            className="px-8 py-4 rounded-xl text-base font-bold
                        text-[#F4EDFF] bg-white/5 border border-white/10 transition-all"
          >
            Ver más funciones
          </motion.a>
        </motion.div>

        {/* Dashboard mockup (Visible y Minimal) */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
          style={{ y, scale }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#E040FB20] to-[#7C4DFF20]
                          rounded-[2rem] blur-xl opacity-50" />
          
          <div className="relative bg-[#0F0A1A] border border-white/10 rounded-2xl
                          overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Topbar minimal */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="h-1.5 w-24 bg-white/5 rounded-full" />
              <div className="w-5 h-5 rounded-full bg-white/5" />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ingresos', value: '$2,480', color: '#E040FB' },
                  { label: 'Cartera', value: '$45k', color: '#7C4DFF' },
                  { label: 'BCV', value: 'Bs 41.22', color: '#00E5CC' },
                  { label: 'Pedidos', value: '34', color: '#A37EF5' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left">
                    <div className="text-[10px] font-bold text-[#9585B8] uppercase tracking-wider mb-1">{kpi.label}</div>
                    <div className="text-xl font-bold text-white tracking-tight">{kpi.value}</div>
                  </div>
                ))}
              </div>
              {/* Línea decorativa */}
              <div className="h-32 bg-white/[0.02] border border-white/5 rounded-xl flex items-end p-4 gap-2">
                 {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                   <div key={i} className="flex-1 bg-[#E040FB20] rounded-t-sm" style={{ height: `${h}%` }} />
                 ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
