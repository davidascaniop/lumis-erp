'use client'
import { useState, useRef } from 'react'
import { Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const FAQS = [
  {
    q: '¿LUMIS funciona si el internet es inestable (como CANTV)?',
    a: 'Sí. El sistema es extremadamente liviano y está optimizado para cargar lo mínimo necesario. Si tienes datos en el teléfono, funciona perfecto.',
  },
  {
    q: '¿Mis datos están seguros en la nube?',
    a: 'Toda tu información está encriptada y respaldada en servidores AWS. Tú eres el dueño de tus datos, nosotros solo los cuidamos.',
  },
  {
    q: '¿Puedo importar mis productos desde mi Excel actual?',
    a: 'Claro que sí. Tenemos una herramienta de importación masiva. En menos de 5 minutos tienes todo tu catálogo listo para vender.',
  },
  {
    q: '¿Funciona con mi impresora fiscal?',
    a: 'Sí. LUMIS genera el reporte de ventas con el formato necesario (Número de Control, IVA) para que tu contador esté feliz.',
  },
  {
    q: '¿Qué pasa si quiero cancelar el servicio?',
    a: 'Sin letra pequeña ni dramas. Cancelas hoy y el servicio sigue activo hasta el final de tu mes pago. Sin penalidades.',
  },
  {
    q: '¿Puedo tener varias sedes o sucursales?',
    a: 'Totalmente. Con el plan PRO puedes ver el stock de todas tus sedes y consolidar ventas en tiempo real desde un solo lugar.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-[#08050F] relative px-6 overflow-hidden" 
      id="faq"
    >
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight leading-tight"
          >
            Preguntas 
            <br />
            <span className="text-[#E040FB]">frecuentes.</span>
          </motion.h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, x: -10 }}
               animate={isInView ? { opacity: 1, x: 0 } : {}}
               transition={{ delay: 0.1 * i, duration: 0.5 }}
               className={`group border rounded-[1.5rem] overflow-hidden transition-all duration-300
                  ${open === i 
                    ? 'bg-[#110B1A] border-[#E040FB]/30 shadow-2xl mb-8' 
                    : 'bg-transparent border-white/5 hover:border-white/10'
                  }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-8 py-6 text-left"
              >
                <span className={`font-bold text-lg md:text-xl transition-colors duration-300 tracking-tight
                   ${open === i ? 'text-white' : 'text-[#F4EDFF]/80 group-hover:text-white'}`}>
                  {faq.q}
                </span>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                   ${open === i 
                     ? 'bg-[#E040FB] text-white rotate-0' 
                     : 'bg-white/5 text-[#9585B8] rotate-0 group-hover:bg-white/10'
                   }`}>
                  {open === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
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
                    <div className="h-px w-full bg-white/5 mb-6" />
                    <p className="text-[#9585B8] text-base md:text-lg leading-relaxed font-normal opacity-90">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={isInView ? { opacity: 1 } : {}}
           transition={{ delay: 1 }}
           className="mt-20 text-center"
        >
           <a 
             href="https://wa.me/584240000000" 
             target="_blank"
             className="text-xs font-bold text-[#9585B8] hover:text-[#E040FB] transition-colors border-b border-white/5 hover:border-[#E040FB]/30 pb-1"
           >
              ¿Tienes otra duda? Escríbenos por WhatsApp →
           </a>
        </motion.div>

      </div>
    </section>
  )
}
