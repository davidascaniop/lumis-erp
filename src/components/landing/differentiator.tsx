'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link2, FileText, CheckCircle, Clock } from 'lucide-react'

const FEATURES = [
  {
    icon: Link2,
    text: 'El cliente entra con su link personal único',
  },
  {
    icon: FileText,
    text: 'Ve todas sus facturas pendientes en Bs. y USD',
  },
  {
    icon: Clock,
    text: 'Marca el pago con número de referencia o foto',
  },
  {
    icon: CheckCircle,
    text: 'Tú verificas y confirmas en segundos desde LUMIS',
  },
]

export function Differentiator() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 bg-slate-50 relative overflow-hidden px-6"
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E040FB]/[0.02] to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Texto Side */}
          <div className="relative z-10 text-center lg:text-left">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={isInView ? { opacity: 1, x: 0 } : {}}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8
                          bg-[#E040FB]/10 border border-[#E040FB]/20"
            >
               <span className="text-[10px] font-bold text-[#E040FB] uppercase tracking-[0.3em]">
                 ✦ EXCLUSIVO DE LUMIS
               </span>
            </motion.div>

            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.2 }}
               className="font-display font-bold text-4xl md:text-6xl text-white mb-10 tracking-tight leading-[1.1]"
            >
              Tu cliente sabe lo que debe 
              <br />
              <span className="text-[#E040FB]">antes de llamarte.</span>
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
               {FEATURES.map((item, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={isInView ? { opacity: 1, y: 0 } : {}}
                   transition={{ delay: 0.4 + (i * 0.1) }}
                   className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                 >
                    <div className="w-10 h-10 rounded-xl bg-[#E040FB]/10 flex items-center justify-center flex-shrink-0">
                       <item.icon className="w-5 h-5 text-[#E040FB]" />
                    </div>
                    <p className="text-sm font-medium text-[#9585B8] leading-snug">
                       {item.text}
                    </p>
                 </motion.div>
               ))}
            </div>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={isInView ? { opacity: 1 } : {}}
               transition={{ delay: 1 }}
               className="space-y-2"
            >
               <p className="font-display text-2xl md:text-3xl font-bold text-white tracking-tighter opacity-80">
                  Sin llamadas. Sin WhatsApp. Sin Excel.
               </p>
            </motion.div>
          </div>

          {/* Visual Side (Mockup Teléfono) */}
          <div className="relative flex justify-center lg:justify-end">
             {/* Glow detrás del teléfono */}
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 8, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#E040FB] rounded-full blur-[120px] pointer-events-none"
             />

             <motion.div 
               initial={{ opacity: 0, rotate: 10, y: 60 }}
               animate={isInView ? { opacity: 1, rotate: 0, y: 0 } : {}}
               transition={{ duration: 1, ease: 'backOut' }}
               className="relative w-[300px] h-[600px] bg-slate-50 border-[8px] border-[#110B1A] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
             >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white rounded-b-2xl z-20" />
                
                {/* Pantalla del Portal */}
                <div className="h-full bg-white p-6 pt-12">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center">
                         <Link2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs font-bold text-white uppercase tracking-widest">Portal LUMIS</div>
                   </div>

                   <div className="bg-white/5 rounded-2xl p-4 mb-6">
                      <div className="text-[10px] text-[#9585B8] uppercase font-bold mb-1">Tu deuda total</div>
                      <div className="text-2xl font-mono font-bold text-[#E040FB]">$1,240.00</div>
                      <div className="text-[10px] text-[#00E5CC] font-bold">Bs. 51,112.80</div>
                   </div>

                   <div className="space-y-4">
                      <div className="text-[10px] text-[#9585B8] uppercase font-bold tracking-widest mb-2">Facturas Pendientes</div>
                      {[
                        { id: '#0012', m: '$450.00', s: 'Vencida', c: '#FF2D55' },
                        { id: '#0024', m: '$320.00', s: 'En espera', c: '#FFB800' },
                        { id: '#0035', m: '$470.00', s: 'Al día', c: '#00E5CC' },
                      ].map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                           <div>
                              <div className="text-[10px] font-bold text-white">{f.id}</div>
                              <div className="text-[8px] font-bold" style={{ color: f.c }}>{f.s}</div>
                           </div>
                           <div className="text-xs font-mono font-bold text-white">{f.m}</div>
                        </div>
                      ))}
                   </div>

                   <div className="absolute bottom-10 left-6 right-6">
                      <div className="w-full py-3 rounded-xl bg-[#E040FB] text-white text-xs font-bold text-center shadow-[0_10px_20px_rgba(224,64,251,0.3)]">
                         REPORTAR PAGO
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
