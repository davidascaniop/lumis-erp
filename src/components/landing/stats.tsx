'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STATS = [
  { label: 'Negocios Activos', value: '200+', color: '#E040FB' },
  { label: 'Transacciones/mes', value: '150k+', color: '#7C4DFF' },
  { label: 'Ahorro de Tiempo', value: '85%', color: '#00E5CC' },
  { label: 'Uptime Sistema', value: '99.9%', color: '#A37EF5' },
]

export function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-16 px-6 bg-[#08050F]"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 * i, duration: 0.8 }}
            className="text-center group"
          >
            <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter"
                 style={{ textShadow: `0 0 20px ${stat.color}20` }}>
               {stat.value}
            </div>
            <div className="text-[10px] font-bold text-[#9585B8] uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
               {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
