'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function Differentiator() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 relative overflow-hidden"
    >

      {/* Glow de fondo masivo */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[1000px] h-[600px] rounded-full
                        bg-[radial-gradient(ellipse,rgba(124,77,255,0.15)_0%,transparent_70%)] blur-[100px]" 
        />
      </div>

      <div className="max-w-6xl mx-auto relative group">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={isInView ? { opacity: 1, scale: 1 } : {}}
           transition={{ duration: 1, ease: 'circOut' }}
           className="bg-[#110B1A] border border-white/10 rounded-[3rem] shadow-[0_60px_100px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl relative"
        >
          {/* Badge interactivo */}
          <div className="px-10 pt-10">
            <motion.div 
               whileHover={{ scale: 1.05 }}
               className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full
                            bg-[#7C4DFF10] border border-[#7C4DFF30]"
            >
              <div className="w-2 h-2 rounded-full bg-[#7C4DFF] animate-pulse" />
              <span className="text-xs font-black text-[#7C4DFF] uppercase tracking-[0.25em]">
                ✦ Exclusivo de LUMIS
              </span>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">

            {/* Texto focalizado */}
            <div className="p-10 lg:p-20 flex flex-col justify-center">
              <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white mb-8 leading-[1.1] tracking-tighter">
                Tu cliente sabe lo que debe
                <br />
                <span className="bg-gradient-to-r from-[#E040FB] via-[#A37EF5] to-[#7C4DFF]
                                 bg-clip-text text-transparent"> antes de llamarte.</span>
              </h2>
              <p className="text-[#9585B8] text-xl md:text-2xl leading-relaxed mb-12 font-body font-medium">
                Cada cliente tiene su propio portal con link personal.
                Ve todas sus facturas pendientes, registra su pago con
                foto de referencia. Tú confirmas desde LUMIS en segundos.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  'Sin llamadas para preguntar qué deben',
                  'Sin WhatsApp con fotos de transferencias',
                  'Verificación de pago en un clic',
                  'Historial completo de cobros',
                ].map((item, i) => (
                  <motion.div 
                     key={item}
                     initial={{ opacity: 0, x: -20 }}
                     animate={isInView ? { opacity: 1, x: 0 } : {}}
                     transition={{ delay: 0.5 + (i * 0.1) }}
                     className="flex items-center gap-3 backdrop-blur-sm bg-white/[0.02] border border-white/5 p-4 rounded-2xl"
                  >
                    <div className="w-6 h-6 rounded-full bg-[rgba(0,229,204,0.15)]
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00E5CC] text-xs font-black">✓</span>
                    </div>
                    <span className="text-sm font-bold text-[#F4EDFF] tracking-tight">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mockup del portal ultra pro */}
            <div className="relative p-10 lg:p-20 flex items-center justify-center
                            border-t lg:border-t-0 lg:border-l border-white/10 group">
              
              {/* Glow focalizado tras el teléfono */}
              <div className="absolute inset-0 bg-[#E040FB]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px]" />

              <motion.div 
                 initial={{ y: 100, rotate: -5 }}
                 animate={isInView ? { y: 0, rotate: 0 } : {}}
                 transition={{ delay: 0.4, duration: 1, ease: 'circOut' }}
                 whileHover={{ y: -20, rotate: 2, scale: 1.05 }}
                 className="bg-[#18102A] border border-white/15 rounded-[3rem]
                              w-full max-w-[320px] overflow-hidden
                              shadow-[0_80px_120px_rgba(0,0,0,0.9)] relative"
              >
                {/* Header del portal pro */}
                <div className="px-8 py-6 bg-gradient-to-r from-[#E040FB15] to-[#7C4DFF15]
                                border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-[#9585B8] uppercase tracking-[0.2em] mb-1">Portal Oficial</div>
                    <div className="font-extrabold text-white text-base tracking-tight">
                      Distribuidora LUMIS
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#E040FB] shadow-[0_0_8px_#E040FB]" />
                  </div>
                </div>

                {/* Deuda total resaltada */}
                <div className="px-8 py-8 border-b border-white/10 bg-[#08050F]/40 backdrop-blur-md">
                  <div className="text-[10px] font-black text-[#9585B8] uppercase tracking-[0.2em] mb-2">Total pendiente hoy</div>
                  <div className="font-mono font-extrabold text-4xl text-[#FF2D55] tracking-tighter">$840.50</div>
                  <div className="text-xs font-bold text-[#9585B8] mt-1 opacity-60">≈ Bs. 34,640.00</div>
                </div>

                {/* Facturas detalladas */}
                <div className="p-4 space-y-2">
                   {[
                     { num: 'F-00124', amt: '$320.50', status: 'Vencida', color: '#FF2D55' },
                     { num: 'F-00123', amt: '$520.00', status: 'A tiempo', color: '#00E5CC' },
                   ].map(f => (
                     <div key={f.num}
                          className="px-6 py-4 flex items-center justify-between
                                     bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/5 transition-colors">
                       <div>
                         <div className="text-sm font-bold text-white tracking-tight">{f.num}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: f.color }}>{f.status}</div>
                       </div>
                       <div className="font-mono text-base font-extrabold text-white tracking-tighter">{f.amt}</div>
                     </div>
                   ))}
                </div>

                {/* Botón de acción focal */}
                <div className="p-8 pt-4">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-5 rounded-2xl text-center text-sm font-black
                                  text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                                  shadow-[0_10px_30px_rgba(224,64,251,0.3)]"
                  >
                    REGISTRAR PAGO AHORA
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
