'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STEPS = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    desc: 'Sin contrato. Sin instalar nada. Todo en la nube desde tu computador o teléfono.',
    color: '#E040FB',
  },
  {
    number: '02',
    title: 'Configura tu negocio',
    desc: 'Agrega tus productos, clientes y sedes. Importa desde Excel o créalo desde cero.',
    color: '#7C4DFF',
  },
  {
    number: '03',
    title: 'Empieza a vender',
    desc: 'Invita a tu equipo y empieza hoy. Soporte por WhatsApp incluido en todos los planes.',
    color: '#00E5CC',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative group">

        {/* Header con diseño focalizado */}
        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-sm font-black uppercase tracking-[0.4em] mb-6"
          >
            Implementación Express
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8 }}
             className="font-display font-extrabold text-5xl md:text-7xl text-white tracking-tighter"
          >
            LUMIS es para hoy.
            <br />
            <span className="text-[#9585B8] opacity-60">En menos de un día.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative items-start">
          
          {/* Línea conectora SV pro (gradiente animado) */}
          <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%]
                          h-[1.5px] bg-gradient-to-r from-transparent via-[#E040FB30] to-transparent overflow-hidden">
             <motion.div 
               animate={{ x: ['100%', '-100%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
               className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E040FB] to-transparent w-full"
             />
          </div>

          {STEPS.map(({ number, title, desc, color }, i) => (
            <motion.div 
                 key={number}
                 initial={{ opacity: 0, y: 30, scale: 0.95 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.2), duration: 0.6 }}
                 className="relative bg-[#110B1A] border border-white/10 rounded-[2.5rem] p-12
                            hover:bg-white/[0.04] hover:border-white/20 transition-all text-center group shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
            >
              {/* Círculo número premium */}
              <div 
                className="w-20 h-20 rounded-[2rem] flex items-center justify-center
                              mx-auto mb-8 font-mono font-black text-2xl relative"
                style={{
                  background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                  color,
                  border: `2px solid ${color}30`
                }}
              >
                <div className="absolute inset-x-0 -top-px h-px bg-white/20" />
                {number}
                
                {/* Glow del número */}
                <div className="absolute inset-0 blur-2xl opacity-20 pointer-events-none" style={{ backgroundColor: color }} />
              </div>
              
              <h3 className="font-display font-bold text-2xl text-white mb-4 tracking-tight">{title}</h3>
              <p className="text-base text-[#9585B8] leading-relaxed font-body font-medium">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
