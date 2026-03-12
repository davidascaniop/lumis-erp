'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STATS = [
  { value: '250',   suffix: '+',  label: 'negocios activos',         color: '#E040FB' },
  { value: '0',     suffix: '$',  label: 'en deuda sin rastrear',    color: '#00E5CC' },
  { value: '30',    suffix: 'min', label: 'actualización BCV',        color: '#7C4DFF' },
  { value: '99',    suffix: '.9%', label: 'uptime garantizado',       color: '#FFB800' },
]

export function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 border-y border-white/5 relative bg-[#110B1A]/50 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-20">
          {STATS.map(({ value, suffix, label, color }, i) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center group"
            >
              <div 
                className="font-display font-extrabold text-5xl md:text-6xl mb-4 
                           tracking-tighter flex items-center justify-center gap-1
                           group-hover:scale-110 transition-transform duration-300"
                style={{ color }}
              >
                <span>{value}</span>
                <span className="text-2xl md:text-3xl opacity-80">{suffix}</span>
              </div>
              <div className="text-xs font-bold text-[#9585B8] uppercase tracking-[0.2em] font-body opacity-80">
                {label}
              </div>
              
              {/* Glow debajo del número */}
              <div className="mt-4 flex justify-center">
                 <div className="w-12 h-1 rounded-full blur-md" style={{ backgroundColor: `${color}40` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
