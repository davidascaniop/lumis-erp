'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function CTAFinal() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto relative group">
        
        {/* Glow dinámico SV style */}
        <motion.div 
           animate={{ 
             opacity: [0.08, 0.12, 0.08],
             scale: [1, 1.1, 1]
           }} 
           transition={{ duration: 8, repeat: Infinity }}
           className="absolute inset-x-0 -top-40 h-[600px] bg-[#E040FB10] blur-[150px] -z-10" 
        />

        <motion.div 
           initial={{ opacity: 0, scale: 0.9, y: 50 }}
           animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
           transition={{ duration: 0.8, ease: 'circOut' }}
           className="relative bg-[#110B1A] border border-[rgba(224,64,251,0.25)]
                        rounded-[3.5rem] p-12 md:p-24 text-center overflow-hidden
                        shadow-[0_80px_150px_rgba(0,0,0,0.8)] backdrop-blur-3xl group"
        >

          {/* Efecto decorativo interno pro */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E040FB05] via-transparent to-[#7C4DFF05] pointer-events-none" />

          <div className="relative">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.3 }}
               className="font-display font-black text-5xl md:text-7xl text-white
                            leading-tight mb-8 tracking-tighter"
            >
              Tu negocio merece más
              <br />
              <span className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                               bg-clip-text text-transparent">
                que una hoja de Excel.
              </span>
            </motion.h2>

            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.4 }}
               className="text-[#9585B8] text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-body font-medium leading-relaxed opacity-80"
            >
              Únete a los +200 negocios venezolanos que ya centralizaron
              su operación con LUMIS.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.5 }}
               className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
            >
              <motion.a 
                href="https://wa.me/584240000000?text=Quiero%20contratar%20LUMIS"
                target="_blank"
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(224,64,251,0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-12 py-6 rounded-2xl text-lg
                            font-black text-white
                            bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                            shadow-[0_20px_40px_rgba(224,64,251,0.4)]
                            transition-all duration-300"
              >
                SOLICITAR ACCESO AHORA →
              </motion.a>
              <motion.a 
                href="https://wa.me/584240000000?text=Quiero%20ver%20una%20demo%20de%20LUMIS"
                target="_blank"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-10 py-6 rounded-2xl text-lg
                            font-black text-[#F4EDFF] bg-white/5 border border-white/10
                            backdrop-blur-md transition-all"
              >
                HABLAR CON VENTAS
              </motion.a>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={isInView ? { opacity: 1 } : {}}
               transition={{ delay: 1 }}
               className="flex justify-center items-center gap-8 opacity-40 group-hover:opacity-80 transition-opacity"
            >
               <span className="text-xs font-black text-[#3D2D5C] uppercase tracking-[0.3em]">Sin contrato</span>
               <div className="w-1.5 h-1.5 rounded-full bg-[#3D2D5C]" />
               <span className="text-xs font-black text-[#3D2D5C] uppercase tracking-[0.3em]">Cancela cuando quieras</span>
               <div className="w-1.5 h-1.5 rounded-full bg-[#3D2D5C]" />
               <span className="text-xs font-black text-[#3D2D5C] uppercase tracking-[0.3em]">Soporte prioritario</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
