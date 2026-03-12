'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: 'Antes tardaba 2 horas haciendo el cierre del día. Con LUMIS son 15 minutos y sé exactamente cuánto gané y cuánto me deben en Bs y USD.',
    name: 'Carlos M.',
    company: 'Distribuidora El Éxito',
    city: 'Caracas',
    color: '#E040FB'
  },
  {
    quote: 'El portal de pago cambió todo. Mis clientes ya no me llaman a preguntar cuánto deben. Solo entran al link, ven su saldo y reportan el pago.',
    name: 'María G.',
    company: 'Mayorista Los Andes',
    city: 'Valencia',
    color: '#7C4DFF'
  },
  {
    quote: 'Tengo 3 sedes y antes era un caos consolidar la información. Ahora veo todo en una sola pantalla al instante. No volvería al Excel jamás.',
    name: 'Roberto A.',
    company: 'Depósito Central',
    city: 'Maracaibo',
    color: '#00E5CC'
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-[#08050F] relative px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight leading-tight"
          >
            Lo que dicen los que 
            <br />
            <span className="text-[#E040FB]">ya usan LUMIS.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: i * 0.2, duration: 0.8 }}
               className="relative flex flex-col p-10 rounded-[2.5rem] bg-[#18102A] border border-white/5 shadow-2xl overflow-hidden group"
            >
               {/* Decorative Quote Mark */}
               <Quote className="absolute top-8 right-8 w-16 h-16 text-[#E040FB] opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:rotate-0" />
               
               <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, idx) => (
                    <span key={idx} className="text-[#FFB800] text-sm">★</span>
                  ))}
               </div>

               <p className="text-[#F4EDFF] text-lg leading-relaxed font-normal mb-10 flex-1 italic tracking-tight">
                  "{t.quote}"
               </p>

               <div className="flex items-center gap-4 pt-8 border-t border-white/5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-white text-lg"
                       style={{ background: `linear-gradient(135deg, ${t.color}, #08050F)` }}>
                     {t.name[0]}
                  </div>
                  <div>
                     <div className="text-white font-bold tracking-tight">{t.name}</div>
                     <div className="text-xs font-bold text-[#9585B8] uppercase tracking-widest">
                        {t.company} <span className="mx-1 opacity-30">·</span> {t.city}
                     </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
