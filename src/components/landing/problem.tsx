'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const COMPARISON = [
  {
    sin: 'No sabes cuánto te deben en total',
    con: 'Cartera vencida en tiempo real con semáforo visual',
  },
  {
    sin: 'Buscas la tasa BCV en el teléfono cada vez',
    con: 'Tasa BCV actualizada automáticamente cada 30 min',
  },
  {
    sin: 'Tus clientes te llaman para saber qué deben',
    con: 'Portal de pago donde el cliente ve su deuda solo',
  },
  {
    sin: 'Cada sede en un Excel diferente',
    con: 'Multi-sede consolidado en un solo dashboard',
  },
  {
    sin: 'No sabes si estás ganando o perdiendo',
    con: 'Utilidad real en Bs. y USD al instante',
  },
]

export function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-bold text-4xl md:text-5xl text-white mb-6 tracking-tight"
          >
            ¿Cuánto dinero pierdes
            <br />
            <span className="text-[#E040FB]">sin saberlo?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#9585B8] text-lg max-w-xl mx-auto"
          >
            Cada día sin sistema es un día con dinero invisible.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#110B1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="grid grid-cols-2 border-b border-white/5 bg-white/[0.02]">
            <div className="px-8 py-6 flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-[#FF2D55] uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF2D55]/10 flex items-center justify-center">❌</span>
                Sin LUMIS
              </span>
            </div>
            <div className="px-8 py-6 flex items-center justify-center gap-3 border-l border-white/5">
              <span className="text-sm font-bold text-[#00E5CC] uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00E5CC]/10 flex items-center justify-center">✅</span>
                Con LUMIS
              </span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div 
              key={i} 
              className="grid grid-cols-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors"
            >
              <div className="px-8 py-8 flex items-start gap-4">
                 <p className="text-sm md:text-base text-[#9585B8] leading-relaxed">
                   {row.sin}
                 </p>
              </div>
              <div className="px-8 py-8 flex items-start gap-4 border-l border-white/[0.03] bg-[rgba(224,64,251,0.01)]">
                 <p className="text-sm md:text-base text-[#F4EDFF] font-medium leading-relaxed">
                   {row.con}
                 </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Orbe sutil lateral */}
      <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[500px] h-[500px] bg-[#E040FB]/5 blur-[100px] rounded-full pointer-events-none" />
    </section>
  )
}
