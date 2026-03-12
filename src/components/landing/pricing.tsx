'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check } from 'lucide-react'

const FEATURES_ALL = [
  'Tasa BCV automática',
  'Semilla Diaria',
  'Soporte WhatsApp',
  'Sin contrato',
  'Actualizaciones incluidas'
]

const PLANES = [
  {
    name: 'LUMIS',
    price: 35,
    desc: 'Ideal para negocios con una sola sede que buscan digitalizarse.',
    popular: false,
    color: '#7C4DFF',
    features: [
      '1 sede',
      '5 usuarios',
      'Inventario completo',
      'Pedidos y ventas',
      'Cartera y cobranza (CxC)',
      'Tasa BCV automática',
      'Semilla Diaria',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'LUMIS PRO',
    price: 75,
    desc: 'La solución definitiva para expansiones y control multi-sucursal.',
    popular: true,
    color: '#E040FB',
    features: [
      'Sedes ilimitadas',
      'Usuarios ilimitados',
      'Todo lo del plan LUMIS +',
      'Portal de pago para clientes',
      'Escáner de código de barras',
      'Reportes avanzados consolidados',
      'Módulo fiscal (Ctrl Ingresos)',
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
      className="py-32 bg-[#08050F] relative px-6 overflow-hidden" 
      id="precios"
    >
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight leading-tight"
          >
            Simple. Transparente. 
            <br />
            <span className="text-[#E040FB]">Sin sorpresas.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-[#9585B8] text-lg max-w-xl mx-auto"
          >
            Sin contrato de permanencia. Cancela cuando quieras.
          </motion.p>
        </div>

        {/* Banner Beneficios Globales */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-16 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-[2rem]"
        >
           {FEATURES_ALL.map((f, i) => (
             <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-[#9585B8] uppercase tracking-widest">
                <Check className="w-3 h-3 text-[#00E5CC]" strokeWidth={3} />
                {f}
             </div>
           ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANES.map((plan, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 40 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.2 + (i * 0.2), duration: 0.8 }}
               className={`relative flex flex-col p-10 rounded-[2.5rem] bg-[#110B1A] border transition-all duration-500 overflow-hidden group
                  ${plan.popular 
                    ? 'border-[#E040FB]/40 shadow-[0_0_50px_rgba(224,64,251,0.1)]' 
                    : 'border-white/5 shadow-2xl hover:border-white/20'
                  }`}
            >
               {plan.popular && (
                 <div className="absolute top-8 right-8 px-3 py-1 rounded-full bg-[#E040FB] text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                    ⭐ MÁS ELEGIDO
                 </div>
               )}

               <div className="mb-10">
                  <div className="text-xs font-bold text-[#9585B8] uppercase tracking-[0.2em] mb-4">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                     <span className="text-6xl font-display font-bold text-white tracking-tighter">${plan.price}</span>
                     <span className="text-lg font-bold text-[#9585B8] opacity-50">/mes</span>
                  </div>
                  <p className="text-sm text-[#9585B8] leading-relaxed font-normal opacity-80">{plan.desc}</p>
               </div>

               <LinkToWA 
                  href="https://wa.me/584240000000" 
                  popular={plan.popular} 
               />

               <div className="space-y-4">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                       <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" style={{ color: plan.color }} strokeWidth={4} />
                       </div>
                       <span className="text-[13px] font-bold text-[#F4EDFF]/70 tracking-tight group-hover:text-white transition-colors">{feat}</span>
                    </div>
                  ))}
               </div>
            </motion.div>
          ))}
        </div>

        {/* Competitor note */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={isInView ? { opacity: 1 } : {}}
           transition={{ delay: 1 }}
           className="mt-16 text-center"
        >
           <p className="text-[#9585B8] text-xs font-medium opacity-50">
              vs FINA: ellos cobran $30-35/mes por menos funciones y sin multi-sede.
           </p>
        </motion.div>

      </div>
    </section>
  )
}

function LinkToWA({ href, popular }: { href: string, popular: boolean }) {
  return (
    <motion.a 
       href={href}
       target="_blank"
       whileHover={{ scale: 1.02 }}
       whileTap={{ scale: 0.98 }}
       className={`w-full py-5 rounded-2xl text-base font-bold text-center mb-10 transition-all tracking-tight uppercase
          ${popular 
            ? 'bg-[#E040FB] text-white shadow-[0_10px_30px_rgba(224,64,251,0.3)]' 
            : 'bg-white/5 text-[#F4EDFF] border border-white/10 hover:bg-white/10'
          }`}
    >
       Solicitar acceso →
    </motion.a>
  )
}
