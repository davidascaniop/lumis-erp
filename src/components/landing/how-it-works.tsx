'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Crea tu cuenta',
    desc: 'Sin contrato de permanencia. Sin instalaciones complejas. Todo en la nube, listo desde hoy mismo.',
  },
  {
    num: '02',
    title: 'Configura tu negocio',
    desc: 'Carga tus productos, clientes y sedes. Si ya tienes un Excel, lo importamos en menos de 5 minutos.',
  },
  {
    num: '03',
    title: 'Invita a tu equipo',
    desc: 'Crea múltiples usuarios con roles y permisos específicos. Empieza a vender y cobrar con orden.',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-slate-50 relative px-6 border-y border-slate-200"
    >
      <div className="max-w-6xl mx-auto text-center relative">
        
        <div className="mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-slate-900 mb-6 tracking-tight leading-tight"
          >
            Tres pasos para 
            <br />
            <span className="text-[#E040FB]">tomar el control.</span>
          </motion.h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
          {/* Línea punteada decorativa (Desktop) */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px border-t border-dashed border-[#E040FB]/30 z-0" />

          {STEPS.map((step, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 30 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.2 + (i * 0.2), duration: 0.8 }}
               className="relative z-10 flex flex-col items-center group"
            >
               <div className="w-20 h-20 rounded-2xl bg-white border border-[#E040FB]/30 flex items-center justify-center mb-10
                               shadow-sm group-hover:border-[#E040FB] transition-colors duration-200">
                  <span className="font-display text-3xl font-bold bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] bg-clip-text text-transparent">
                     {step.num}
                  </span>
               </div>
               
               <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                  {step.title}
               </h3>
               <p className="text-slate-500 text-base leading-relaxed font-normal max-w-[280px]">
                  {step.desc}
               </p>
            </motion.div>
          ))}
        </div>

        {/* Support Badge */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={isInView ? { opacity: 1 } : {}}
           transition={{ delay: 1 }}
           className="mt-20 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm"
        >
           <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Soporte por WhatsApp incluido</span>
        </motion.div>

      </div>
    </section>
  )
}
