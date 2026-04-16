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
      className="py-32 bg-slate-50 relative px-6 overflow-hidden" 
      id="faq"
    >
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-slate-900 mb-6 tracking-tight leading-tight"
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
                    ? 'bg-white border-[#E040FB]/30 shadow-md mb-4'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-8 py-6 text-left"
              >
                <span className={`font-bold text-lg md:text-xl transition-colors duration-300 tracking-tight
                   ${open === i ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                  {faq.q}
                </span>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                   ${open === i
                     ? 'bg-[#E040FB] text-white'
                     : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
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
                    <div className="h-px w-full bg-slate-100 mb-6" />
                    <p className="text-slate-500 text-base md:text-lg leading-relaxed font-normal">
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
             href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20tengo%20una%20pregunta"
             target="_blank" rel="noopener noreferrer"
             className="text-xs font-bold text-slate-500 hover:text-[#25D366] transition-colors border-b border-slate-200 hover:border-[#25D366]/50 pb-1"
           >
              ¿Tienes otra duda? Escríbenos por WhatsApp →
           </a>
        </motion.div>

      </div>
    </section>
  )
}
