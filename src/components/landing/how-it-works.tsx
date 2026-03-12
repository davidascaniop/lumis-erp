'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Carga tu Inventario',
    desc: 'Importa tus productos desde Excel en minutos o usa el escáner de códigos.',
  },
  {
    num: '02',
    title: 'Registra tus Ventas',
    desc: 'Toma pedidos desde el dashboard. Se calcula automáticamente con la tasa BCV del día.',
  },
  {
    num: '03',
    title: 'Controla tu Cartera',
    desc: 'Visualiza qué clientes deben y permite que paguen a través de su portal dedicado.',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto relative text-center">

        <div className="mb-20">
          <motion.p 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Metodología
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="font-display font-bold text-3xl md:text-5xl text-white mb-4 tracking-tight"
          >
            LUMIS es para hoy.
            <br />
            <span className="text-[#9585B8] opacity-60">En menos de un día.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {STEPS.map(({ num, title, desc }, i) => (
            <motion.div 
                 key={num}
                 initial={{ opacity: 0, y: 10 }}
                 animate={isInView ? { opacity: 1, y: 0 } : {}}
                 transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                 className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.03] hover:border-white/10"
            >
              <div className="text-xl font-bold text-[#E040FB] mb-6 opacity-60 font-mono tracking-tighter">
                {num}
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-[#9585B8] leading-relaxed opacity-80 font-normal">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
