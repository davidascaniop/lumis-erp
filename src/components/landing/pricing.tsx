'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const PLANES = [
  {
    name: 'LUMIS',
    price: 35,
    desc: 'Esencial para empezar.',
    popular: false,
    color: '#7C4DFF',
    features: [
      '1 sede',
      '5 usuarios',
      'Inventario completo',
      'Pedidos y ventas',
      'Cartera y cobranza (CxC)',
      'Tasa BCV automática',
    ],
  },
  {
    name: 'LUMIS PRO',
    price: 75,
    desc: 'Escalabilidad total.',
    popular: true,
    color: '#E040FB',
    features: [
      'Sedes ilimitadas',
      'Usuarios ilimitados',
      'Todo lo del plan básico',
      'Portal de pago para clientes',
      'Escáner de código de barras',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
]

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-24 px-6 relative overflow-hidden" id="precios"
    >
      <div className="max-w-4xl mx-auto relative group">

        <div className="text-center mb-20">
          <motion.p 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Precios Claros
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="font-display font-bold text-3xl md:text-5xl text-white mb-6 tracking-tight"
          >
            Transparente.
            <br />
            <span className="text-[#9585B8] opacity-60">Sin sorpresas.</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             className="text-[#9585B8] text-base md:text-lg max-w-xl mx-auto font-body leading-relaxed font-normal opacity-80"
          >
            Menos de lo que pierdes en un día sin sistema.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANES.map(({ name, price, desc, popular, color, features }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 10, scale: 0.98 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.1), duration: 0.6 }}
                 className={`relative rounded-2xl p-8 flex flex-col transition-all overflow-hidden ${
                   popular
                     ? 'bg-[#110B1A] border border-[rgba(224,64,251,0.3)] shadow-2xl'
                     : 'bg-[#110B1A] border border-white/5 shadow-2xl'
                 }`}
            >
              <div className="mb-8 relative z-10 text-center">
                <div className="text-xs font-bold text-[#9585B8] uppercase tracking-[0.2em] mb-2">{name}</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">${price}</span>
                  <span className="text-sm font-bold text-[#9585B8] opacity-40">/mes</span>
                </div>
                <div className="text-xs font-normal text-[#9585B8] mt-2 opacity-60 leading-relaxed">{desc}</div>
              </div>

              <motion.a 
                 href="https://wa.me/584240000000"
                 target="_blank"
                 className={`w-full py-3.5 rounded-xl text-sm font-bold text-center
                             mb-10 transition-all block relative z-10 tracking-tight ${
                   popular
                     ? 'bg-[#E040FB] text-white shadow-xl hover:bg-[#E040FB]/90'
                     : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                 }`}
              >
                OBTENER ACCESO →
              </motion.a>

              <div className="space-y-3.5 flex-1 relative z-10">
                {features.map((f, i) => (
                  <div 
                     key={f} 
                     className="flex items-start gap-4"
                  >
                    <span className="text-[10px] font-bold mt-0.5" style={{ color }}>✓</span>
                    <span className="text-xs font-bold text-[#9585B8] tracking-tight opacity-70 group-hover:opacity-100">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
