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
  {
    sin:  'Pierdes ventas por no saber qué hay en inventario',
    con:  'Stock en tiempo real con alertas de quiebre',
  },
  {
    sin:  'Cobrar es perseguir clientes por WhatsApp',
    con:  'El cliente paga por su portal y tú confirmas en segundos',
  },
]

export function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 relative bg-[#08050F]" id="funciones"
    >
      <div className="max-w-6xl mx-auto relative">

        {/* Header con entrada lateral */}
        <div className="text-center mb-24">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-[#E040FB] text-sm font-bold uppercase tracking-[0.3em] mb-6"
          >
            El problema
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="font-display font-bold text-5xl md:text-7xl text-white mb-8 tracking-tighter"
          >
            ¿Cuánto dinero pierdes
            <br />
            <span className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                             bg-clip-text text-transparent"> sin saberlo?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-[#9585B8] text-xl md:text-2xl max-w-3xl mx-auto font-body leading-relaxed font-medium"
          >
            Cada negocio que opera sin sistema pierde entre el 15% y 30%
            de sus ingresos en ineficiencias invisibles.
          </motion.p>
        </div>

        {/* Tabla Sin vs Con con hover dinámico */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.8, ease: 'circOut' }}
          className="bg-[#110B1A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >

          {/* Header tabla pro */}
          <div className="grid grid-cols-2 border-b border-white/10">
            <div className="px-12 py-8 flex items-center justify-center gap-4 bg-white/[0.02]">
              <div className="w-4 h-4 rounded-full bg-[#FF2D55] shadow-[0_0_15px_rgba(255,45,85,0.6)]" />
              <span className="font-extrabold text-lg text-[#9585B8] uppercase tracking-widest">Sin LUMIS</span>
            </div>
            <div className="px-12 py-8 flex items-center justify-center gap-4
                            bg-gradient-to-r from-[rgba(224,64,251,0.06)] to-[rgba(124,77,255,0.06)] 
                            border-l border-white/10">
              <div className="w-4 h-4 rounded-full bg-[#00E5CC] shadow-[0_0_15px_rgba(0,229,204,0.6)] animate-pulse" />
              <span className="font-extrabold text-lg text-[#00E5CC] uppercase tracking-widest">Con LUMIS</span>
            </div>
          </div>

          {/* Rows */}
          {PAINS.map(({ sin, con }, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 + (i * 0.1) }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              className="grid grid-cols-2 border-b border-white/[0.04] last:border-0
                            transition-colors group"
            >
              <div className="px-10 py-8 flex items-start gap-4 transform group-hover:-translate-x-1 transition-transform">
                <span className="text-[#FF2D55] text-2xl mt-0.5 flex-shrink-0 font-bold opacity-60">✗</span>
                <span className="text-base text-[#9585B8] leading-relaxed font-medium">{sin}</span>
              </div>
              <div className="px-10 py-8 flex items-start gap-4
                              bg-[rgba(224,64,251,0.02)] border-l border-white/10
                              group-hover:bg-[rgba(224,64,251,0.04)] transition-all">
                <span className="text-[#00E5CC] text-2xl mt-0.5 flex-shrink-0 font-bold">✓</span>
                <span className="text-base text-[#F4EDFF] leading-relaxed font-bold tracking-tight">{con}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Glow de fondo para la sección de tabla */}
        <div className="absolute -inset-20 pointer-events-none -z-10 opacity-40">
           <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#E040FB]/10 rounded-full blur-[120px]" />
           <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[#7C4DFF]/10 rounded-full blur-[120px]" />
        </div>
      </div>
    </section>
  )
}
