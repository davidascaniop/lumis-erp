'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const PAINS = [
  {
    sin:  'No sabes cuánto te deben en total',
    con:  'Cartera vencida en tiempo real con semáforo de crédito',
  },
  {
    sin:  'Buscas la tasa BCV en el teléfono cada vez',
    con:  'Tasa BCV actualizada automáticamente cada 30 minutos',
  },
  {
    sin:  'Tus clientes te llaman para saber qué deben',
    con:  'Portal de pago donde el cliente ve su deuda solo',
  },
  {
    sin:  'Cada sede maneja su propio Excel',
    con:  'Multi-sede consolidado en un solo dashboard',
  },
]

export function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 px-6 relative bg-[#08050F]" id="funciones"
    >
      <div className="max-w-4xl mx-auto relative text-center">

        <div className="mb-20">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Optimización
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-display font-bold text-3xl md:text-5xl text-white mb-6 tracking-tight"
          >
            ¿Cuánto dinero pierdes
            <br />
            <span className="text-[#E040FB]">sin saberlo?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-[#9585B8] text-base md:text-lg max-w-xl mx-auto font-body leading-relaxed font-normal opacity-80"
          >
            Cada negocio sin sistema pierde entre el 15% y 30%
            de sus ingresos en ineficiencias invisibles.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          className="bg-[#110B1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header minimal */}
          <div className="grid grid-cols-2 border-b border-white/5 opacity-80">
            <div className="px-8 py-5 flex items-center justify-center gap-3">
              <span className="font-bold text-xs text-[#9585B8] uppercase tracking-widest">Sin LUMIS</span>
            </div>
            <div className="px-8 py-5 flex items-center justify-center gap-3 bg-white/[0.02]">
              <span className="font-bold text-xs text-[#00E5CC] uppercase tracking-widest">Con LUMIS</span>
            </div>
          </div>

          {/* Rows minimal */}
          {PAINS.map(({ sin, con }, i) => (
            <div 
              key={i}
              className="grid grid-cols-2 border-b border-white/[0.04] last:border-0"
            >
              <div className="px-8 py-6 flex items-start gap-4">
                <span className="text-[#FF2D55] text-lg font-bold">✗</span>
                <span className="text-sm text-[#9585B8] text-left leading-relaxed">{sin}</span>
              </div>
              <div className="px-8 py-6 flex items-start gap-4 bg-[rgba(224,64,251,0.02)]">
                <span className="text-[#00E5CC] text-lg font-bold">✓</span>
                <span className="text-sm text-[#F4EDFF] text-left leading-relaxed font-medium">{con}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
