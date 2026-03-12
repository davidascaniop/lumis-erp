'use client'
import { useState, useRef } from 'react'
import { Plus, Minus, Search } from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const FAQS = [
  {
    q: '¿Funciona bien con internet inestable?',
    a: 'LUMIS está optimizado para conexiones venezolanas. Las consultas son livianas y el sistema guarda datos localmente.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Toda tu información está encriptada y almacenada en servidores con 99.9% de uptime.',
  },
  {
    q: '¿Puedo importar mis productos desde Excel?',
    a: 'Sí. LUMIS acepta archivos Excel y CSV. En menos de 5 minutos tienes todo tu catálogo cargado.',
  },
  {
    q: '¿Funciona con mi impresora fiscal?',
    a: 'Sí. LUMIS genera el resumen fiscal con número de control e IVA calculado.',
  },
  {
    q: '¿Qué pasa si quiero cancelar?',
    a: 'Sin penalidades ni letra pequeña. Cancelas cuando quieras desde tu cuenta.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 px-6 bg-[#08050F] relative overflow-hidden" id="faq"
    >
      <div className="max-w-2xl mx-auto relative group">

        <div className="text-center mb-20">
          <motion.p 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Soporte de Confianza
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="font-display font-bold text-3xl md:text-5xl text-white mb-4 tracking-tight"
          >
            Lo que siempre
            <br />
            <span className="text-[#E040FB]"> preguntan.</span>
          </motion.h2>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -10 }}
                 animate={isInView ? { opacity: 1, x: 0 } : {}}
                 transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                 className={`group/faq bg-[#110B1A] border rounded-xl overflow-hidden transition-all duration-300 ${
                   open === i ? 'border-[#E040FB30] shadow-2xl mb-4' : 'border-white/5 hover:border-white/10'
                 }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left group">
                <span className={`font-bold text-base transition-all duration-300 tracking-tight ${
                  open === i ? 'text-white' : 'text-[#F4EDFF] opacity-80'
                }`}>
                  {q}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                flex-shrink-0 ml-4 transition-all ${
                  open === i
                    ? 'bg-[#E040FB] text-white shadow-lg'
                    : 'bg-white/5 text-[#9585B8]'
                }`}>
                  {open === i
                    ? <Minus className="w-4 h-4 font-black" />
                    : <Plus className="w-4 h-4 font-black" />
                  }
                </div>
              </button>
              
              <AnimatePresence>
                {open === i && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     transition={{ duration: 0.3 }}
                     className="px-6 pb-6 pt-0"
                  >
                    <p className="text-sm text-[#9585B8] leading-relaxed font-body font-normal opacity-80">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
            className="mt-16 text-center"
        >
          <a href="https://wa.me/584240000000" target="_blank" className="text-xs font-bold text-[#9585B8] hover:text-[#E040FB] transition-colors border-b border-white/5 hover:border-[#E040FB30] pb-1">
             Hablar con un asesor por WhatsApp →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
