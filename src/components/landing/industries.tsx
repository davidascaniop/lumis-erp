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
      className="py-24 px-6 bg-[#08050F] relative overflow-hidden" id="industrias"
    >
      <div className="max-w-4xl mx-auto relative text-center">

        <div className="mb-20">
          <motion.p 
             initial={{ opacity: 0, x: -10 }}
             animate={isInView ? { opacity: 1, x: 0 } : {}}
             className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Para quién es LUMIS
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="font-display font-bold text-3xl md:text-5xl text-white mb-6 tracking-tight"
          >
            Si vendes,
            <br />
            <span className="text-[#E040FB]"> LUMIS es para ti.</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="text-[#9585B8] text-base md:text-lg max-w-xl mx-auto font-body leading-relaxed font-normal opacity-80"
          >
            Diseñado para cualquier negocio venezolano que maneje inventario,
            clientes y cobros.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map(({ emoji, name }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 10, scale: 0.98 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.05), duration: 0.5 }}
                 className="flex items-center gap-4 p-6 rounded-2xl
                            bg-[#110B1A] border border-white/5 transition-all group cursor-default
                            hover:bg-white/[0.03] hover:border-white/10"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300 transform-gpu">{emoji}</span>
              <span className="text-sm font-bold text-[#9585B8] group-hover:text-white transition-colors leading-tight">
                {name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tagline final minimal */}
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           transition={{ delay: 1 }}
           className="mt-12"
        >
          <p className="text-[#9585B8] text-sm font-normal">
            ¿Tu industria no aparece?{' '}
            <motion.a 
               href="https://wa.me/584240000000" 
               target="_blank"
               className="text-[#E040FB] hover:underline font-bold inline-flex items-center gap-2 border-b border-transparent hover:border-[#E040FB30]"
            >
              Consultar WhatsApp →
            </motion.a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
