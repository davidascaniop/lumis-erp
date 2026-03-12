'use client'
import { useState, useRef } from 'react'
import { Plus, Minus, Search } from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const FAQS = [
  {
    q: '¿Funciona bien con internet inestable?',
    a: 'LUMIS está optimizado para conexiones venezolanas. Las consultas son livianas y el sistema guarda datos localmente en caso de cortes breves. No perderás información.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Toda tu información está encriptada y almacenada en servidores con 99.9% de uptime. Solo tú y tu equipo tienen acceso. Hacemos backups automáticos cada hora.',
  },
  {
    q: '¿Puedo importar mis productos desde Excel?',
    a: 'Sí. LUMIS acepta archivos Excel y CSV. En menos de 5 minutos tienes todo tu catálogo cargado. También puedes crearlo manualmente o con pistola de códigos de barras.',
  },
  {
    q: '¿Funciona con mi impresora fiscal?',
    a: 'Sí. LUMIS genera el resumen fiscal con número de control, base imponible e IVA calculado. Lo llevas a tu máquina fiscal existente. No necesitas cambiar tu hardware.',
  },
  {
    q: '¿Qué pasa si quiero cancelar?',
    a: 'Sin penalidades ni letra pequeña. Cancelas cuando quieras desde tu cuenta. Puedes exportar todos tus datos antes de salir — son tuyos, siempre.',
  },
  {
    q: '¿Cuántos usuarios puedo agregar?',
    a: 'El plan LUMIS incluye 5 usuarios. El plan LUMIS PRO incluye usuarios ilimitados. Cada usuario puede tener rol de admin, supervisor o vendedor.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden" id="faq"
    >
      <div className="max-w-3xl mx-auto relative group">

        {/* Header focalizado SV pro */}
        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-sm font-black uppercase tracking-[0.4em] mb-6"
          >
            Soporte de Confianza
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8 }}
             className="font-display font-extrabold text-5xl md:text-6xl text-white mb-4 tracking-tighter"
          >
            Lo que siempre
            <br />
            <span className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                             bg-clip-text text-transparent"> preguntan.</span>
          </motion.h2>
        </div>

        {/* Acordeón premium */}
        <div className="space-y-4">
          {FAQS.map(({ q, a }, i) => (
            <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -20 }}
                 animate={isInView ? { opacity: 1, x: 0 } : {}}
                 transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                 className={`group/faq bg-[#110B1A] border rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${
                   open === i ? 'border-[rgba(224,64,251,0.5)] shadow-[0_0_30px_rgba(224,64,251,0.1)] mb-6' : 'border-white/10 hover:border-white/20'
                 }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-8 py-7 text-left group">
                <span className={`font-extrabold text-lg md:text-xl transition-all duration-300 tracking-tight ${
                  open === i ? 'text-white' : 'text-[#F4EDFF] opacity-80 group-hover/faq:opacity-100 group-hover/faq:translate-x-1'
                }`}>
                  {q}
                </span>
                <motion.div 
                  animate={{ rotate: open === i ? 180 : 0 }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center
                                flex-shrink-0 ml-6 transition-all shadow-inner ${
                  open === i
                    ? 'bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] text-white'
                    : 'bg-white/5 text-[#9585B8] group-hover/faq:bg-white/10'
                }`}>
                  {open === i
                    ? <Minus className="w-5 h-5 font-black" />
                    : <Plus className="w-5 h-5 font-black" />
                  }
                </motion.div>
              </button>
              
              <AnimatePresence>
                {open === i && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     transition={{ duration: 0.4, ease: 'circOut' }}
                     className="px-8 pb-8 pt-0"
                  >
                    <p className="text-lg text-[#9585B8] leading-relaxed font-body font-medium tracking-tight">
                      {a}
                    </p>
                    
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '100%' }}
                       transition={{ delay: 0.3, duration: 0.8 }}
                       className="h-px bg-gradient-to-r from-[#E040FB20] via-[#E040FB40] to-transparent mt-8"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer FAQ focalizado */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
            className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-5 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl">
            <Search className="w-5 h-5 text-[#E040FB]" />
            <p className="text-[#9585B8] font-bold tracking-tight">
              ¿Tienes otra duda?{' '}
              <a href="https://wa.me/584240000000" target="_blank" className="text-white hover:text-[#E040FB] transition-colors border-b border-white/20 hover:border-[#E040FB] ml-2">
                Habla con un asesor por WhatsApp
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
