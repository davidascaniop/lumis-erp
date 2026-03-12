'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

export function CTAFinal() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        
        <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 30 }}
           animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
           transition={{ duration: 1, ease: 'circOut' }}
           className="relative bg-[#110B1A] border border-[#E040FB]/10 
                        rounded-[3rem] p-12 md:p-32 text-center overflow-hidden
                        shadow-[0_0_100px_rgba(224,64,251,0.05)] group"
        >
          {/* Intense Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,64,251,0.1)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E040FB]/40 to-transparent" />

          <div className="relative z-10">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.3 }}
               className="font-display font-bold text-4xl md:text-7xl text-white
                            leading-[0.95] mb-8 tracking-tighter"
            >
              Tu negocio merece más
              <br />
              <span className="text-[#E040FB]">
                que un cuaderno y un Excel.
              </span>
            </motion.h2>

            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.4 }}
               className="text-[#9585B8] text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-normal opacity-90"
            >
              Miles de negocios venezolanos ya gestionan su operación con LUMIS. Es tu turno de escalar con orden.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.5 }}
               className="flex flex-col items-center gap-6"
            >
              <motion.a 
                href="https://wa.me/584240000000"
                target="_blank"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center gap-4 px-12 py-6 rounded-[2rem] text-xl font-bold text-white overflow-hidden transition-all shadow-[0_20px_60px_rgba(224,64,251,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] group-hover:scale-110 transition-transform duration-500" />
                <span className="relative z-10 tracking-tight uppercase">Solicitar acceso ahora</span>
                <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.a>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 opacity-50">
                 {['Sin contrato', 'Cancela cuando quieras', 'Soporte en WhatsApp'].map((text, idx) => (
                   <span key={idx} className="text-[11px] font-bold text-[#F4EDFF] uppercase tracking-[0.2em]">
                      {text}
                   </span>
                 ))}
              </div>
            </motion.div>
          </div>

          {/* Decorative Corner Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E040FB]/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7C4DFF]/10 blur-[100px] rounded-full" />
        </motion.div>
      </div>
    </section>
  )
}
