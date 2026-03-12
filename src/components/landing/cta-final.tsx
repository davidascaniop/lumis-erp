'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function CTAFinal() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto relative group">
        
        <motion.div 
           initial={{ opacity: 0, scale: 0.98, y: 20 }}
           animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
           transition={{ duration: 0.8, ease: 'circOut' }}
           className="relative bg-[#110B1A] border border-white/5
                        rounded-3xl p-12 md:p-20 text-center overflow-hidden
                        shadow-2xl backdrop-blur-3xl group"
        >

          <div className="relative">
            <motion.h2 
               initial={{ opacity: 0, y: 10 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.3 }}
               className="font-display font-bold text-3xl md:text-5xl text-white
                            leading-tight mb-6 tracking-tight"
            >
              Tu negocio merece más
              <br />
              <span className="text-[#E040FB]">
                que una hoja de Excel.
              </span>
            </motion.h2>

            <motion.p 
               initial={{ opacity: 0, y: 10 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.4 }}
               className="text-[#9585B8] text-base md:text-lg mb-10 max-w-xl mx-auto font-body font-normal opacity-80"
            >
              Únete a los +200 negocios que ya centralizaron su operación.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.5 }}
               className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.a 
                href="https://wa.me/584240000000"
                target="_blank"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl text-base font-bold text-white bg-[#E040FB] shadow-xl transition-all"
              >
                Solicitar Acceso Ahora
              </motion.a>
              <motion.a 
                href="https://wa.me/584240000000"
                target="_blank"
                className="px-8 py-4 rounded-xl text-base font-bold text-[#F4EDFF] bg-white/5 border border-white/10 backdrop-blur-md transition-all"
              >
                Ver Demo
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
