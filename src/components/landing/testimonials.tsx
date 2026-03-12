'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const TESTIMONIOS = [
  {
    quote: 'Antes tardaba 2 horas haciendo el cierre del día. Con LUMIS son 15 minutos y tengo todo claro.',
    name: 'Carlos M.',
    empresa: 'Distribuidora El Éxito',
    ciudad: 'Caracas',
    initial: 'C',
    color: '#E040FB',
  },
  {
    quote: 'El portal de pago cambió todo. Mis clientes ya no me llaman a preguntar cuánto deben.',
    name: 'María G.',
    empresa: 'Mayorista Los Andes',
    ciudad: 'Valencia',
    initial: 'M',
    color: '#7C4DFF',
  },
  {
    quote: 'La tasa BCV automática me ahorra buscarla 20 veces al día. Pequeño detalle, gran diferencia.',
    name: 'José R.',
    empresa: 'Ferretería Central',
    ciudad: 'Maracaibo',
    initial: 'J',
    color: '#00E5CC',
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative group">

        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-sm font-black uppercase tracking-[0.4em] mb-6"
          >
            Voces de nuestro impacto
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8, ease: 'circOut' }}
             className="font-display font-extrabold text-5xl md:text-7xl text-white mb-4 tracking-tighter"
          >
            Negocios reales.
            <br />
            <span className="text-[#9585B8] opacity-60">Resultados reales.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIOS.map(({ quote, name, empresa, ciudad, initial, color }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 30, scale: 0.95 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.15), duration: 0.6 }}
                 whileHover={{ y: -10, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
                 className="bg-[#110B1A] border border-white/10 rounded-[2.5rem] p-10
                            hover:border-[#E040FB30] shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all flex flex-col group"
            >

              {/* Stars pro */}
              <div className="flex gap-1.5 mb-8">
                {[...Array(5)].map((_, i) => (
                  <motion.span 
                    key={i} 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ delay: i * 0.1, duration: 2, repeat: Infinity }}
                    className="text-[#FFB800] text-lg font-black"
                  >
                    ★
                  </motion.span>
                ))}
              </div>

              {/* Quote con tipografía premium */}
              <p className="text-[#F4EDFF] text-lg leading-relaxed flex-1 mb-10 font-medium italic opacity-90 tracking-tight">
                "{quote}"
              </p>

              {/* Author SV style */}
              <div className="flex items-center gap-4 pt-8 border-t border-white/5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                                font-black text-white text-xl flex-shrink-0 relative overflow-hidden"
                     style={{
                       background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                       border: `2px solid ${color}40`
                     }}>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {initial}
                </div>
                <div>
                  <div className="text-base font-extrabold text-white tracking-tight">{name}</div>
                  <div className="text-xs font-bold text-[#9585B8] uppercase tracking-[0.15em] opacity-80">{empresa} · {ciudad}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
