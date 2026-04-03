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
      className="py-32 bg-white relative px-6 overflow-hidden" 
      id="precios"
    >
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-slate-900 mb-6 tracking-tight leading-tight"
          >
            Simple. Transparente. 
            <br />
            <span className="text-[#E040FB]">Sin sorpresas.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-slate-500 text-lg max-w-xl mx-auto"
          >
            Sin contrato de permanencia. Cancela cuando quieras.
          </motion.p>
        </div>

        {/* Banner Beneficios Globales */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-16 px-8 py-4 bg-slate-50 border border-slate-200 rounded-[2rem]"
        >
           {FEATURES_ALL.map((f, i) => (
             <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
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
               className={`relative flex flex-col p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden group
                  ${plan.popular
                    ? 'bg-white border-[#E040FB]/50 shadow-[0_0_40px_rgba(224,64,251,0.08)]'
                    : 'bg-white border-slate-200 shadow-md hover:border-slate-300'
                  }`}
            >
               {plan.popular && (
                 <div className="absolute top-8 right-8 px-3 py-1 rounded-full bg-[#E040FB] text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                    ⭐ MÁS ELEGIDO
                 </div>
               )}

               <div className="mb-10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                     <span className="text-6xl font-display font-bold text-slate-900 tracking-tighter">${plan.price}</span>
                     <span className="text-lg font-bold text-slate-400">/mes</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-normal">{plan.desc}</p>
               </div>

               <LinkToWA
                  href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20quiero%20una%20demo"
                  popular={plan.popular}
               />

               <div className="space-y-4">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                       <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" style={{ color: plan.color }} strokeWidth={4} />
                       </div>
                       <span className="text-[13px] font-bold text-slate-600 tracking-tight">{feat}</span>
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
           <p className="text-slate-400 text-xs font-medium">
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
       className={`w-full py-5 rounded-2xl text-base font-bold text-center mb-10 transition-all tracking-tight flex items-center justify-center gap-2
          ${popular
            ? 'bg-[#25D366] text-white shadow-lg hover:bg-[#1da851]'
            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
          }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      Hablar por WhatsApp
    </motion.a>
  )
}
