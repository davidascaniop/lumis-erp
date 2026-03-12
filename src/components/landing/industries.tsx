'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const INDUSTRIES = [
  { emoji: '🏭', name: 'Distribuidoras de consumo masivo'  },
  { emoji: '🏪', name: 'Mayoristas y depósitos'            },
  { emoji: '🔧', name: 'Ferreterías y materiales'          },
  { emoji: '💊', name: 'Farmacias y botiquines'            },
  { emoji: '🚗', name: 'Repuestos y autopartes'            },
  { emoji: '📦', name: 'Empresas de servicios'             },
  { emoji: '🍺', name: 'Licorerías y abastos'              },
  { emoji: '📎', name: 'Papelerías y suministros'          },
  { emoji: '💻', name: 'Electrónica y accesorios'          },
]

export function Industries() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F] relative overflow-hidden" id="industrias"
    >
      <div className="max-w-6xl mx-auto relative">

        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, x: -30 }}
             animate={isInView ? { opacity: 1, x: 0 } : {}}
             className="text-[#E040FB] text-sm font-black uppercase tracking-[0.4em] mb-6"
          >
            Para quién es LUMIS
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             transition={{ duration: 1, ease: 'circOut' }}
             className="font-display font-extrabold text-5xl md:text-7xl text-white mb-8 tracking-tighter"
          >
            Si vendes,
            <br />
            <span className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                             bg-clip-text text-transparent"> LUMIS es para ti.</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ delay: 0.2 }}
             className="text-[#9585B8] text-xl md:text-2xl max-w-2xl mx-auto font-body font-medium leading-relaxed"
          >
            Diseñado para cualquier negocio venezolano que maneje inventario,
            clientes y cobros.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map(({ emoji, name }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.05), duration: 0.5 }}
                 whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(224, 64, 251, 0.3)' }}
                 className="flex items-center gap-6 p-8 rounded-[2rem]
                            bg-[#110B1A] border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                            transition-all group cursor-default"
            >
              <span className="text-4xl group-hover:scale-125 transition-transform duration-300 transform-gpu">{emoji}</span>
              <span className="text-base font-bold text-[#9585B8] group-hover:text-white transition-colors leading-tight">
                {name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tagline final premium */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           transition={{ delay: 1 }}
           className="text-center mt-16"
        >
          <p className="text-[#9585B8] text-lg font-medium">
            ¿Tu industria no aparece?{' '}
            <motion.a 
               href="https://wa.me/584240000000" 
               target="_blank"
               whileHover={{ x: 5 }}
               className="text-[#E040FB] hover:underline font-black inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E040FB10] border border-[#E040FB30]"
            >
              Escríbenos y te decimos →
            </motion.a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
