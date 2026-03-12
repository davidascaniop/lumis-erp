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
      className="py-24 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto relative group">

        <div className="text-center mb-20">
          <motion.p 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Voces de nuestro impacto
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8, ease: 'circOut' }}
             className="font-display font-bold text-3xl md:text-5xl text-white mb-4 tracking-tight"
          >
            Negocios reales.
            <br />
            <span className="text-[#9585B8] opacity-60">Resultados reales.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIOS.map(({ quote, name, empresa, ciudad, initial, color }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 10, scale: 0.98 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.1), duration: 0.6 }}
                 className="bg-[#110B1A] border border-white/5 rounded-2xl p-8
                            hover:border-white/10 shadow-2xl transition-all flex flex-col group overflow-hidden"
            >
              <div className="flex gap-1 mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#FFB800] text-sm">★</span>
                ))}
              </div>

              <p className="text-[#F4EDFF] text-sm leading-relaxed flex-1 mb-8 font-normal italic opacity-90 tracking-tight">
                "{quote}"
              </p>

              <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                                font-bold text-white text-sm flex-shrink-0 relative overflow-hidden"
                     style={{
                       background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                       border: `1px solid ${color}20`
                     }}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {initial}
                </div>
                <div>
                  <div className="text-sm font-bold text-white tracking-tight">{name}</div>
                  <div className="text-[10px] font-bold text-[#9585B8] uppercase tracking-widest opacity-60">{empresa}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
