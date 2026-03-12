'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const PLANES = [
  {
    name: 'LUMIS',
    price: 35,
    desc: 'Todo lo esencial para empezar a crecer.',
    popular: false,
    color: '#7C4DFF',
    features: [
      '1 sede',
      '5 usuarios',
      'Inventario completo',
      'Pedidos y ventas',
      'Cartera y cobranza (CxC)',
      'Tasa BCV automática',
      'Semilla diaria',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'LUMIS PRO',
    price: 75,
    desc: 'Para negocios con múltiples sedes y equipos grandes.',
    popular: true,
    color: '#E040FB',
    features: [
      'Sedes ilimitadas',
      'Usuarios ilimitados',
      'Todo lo del plan básico',
      'Portal de pago para clientes',
      'Semilla diaria',
      'Escáner de código de barras',
      'Reportes avanzados',
      'Dashboard multi-sede',
      'Soporte prioritario',
    ],
  },
]

const INCLUYE_TODOS = [
  'Tasa BCV automática',
  'Sin contrato de permanencia',
  'Cancela cuando quieras',
  'Actualizaciones incluidas',
]

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 relative overflow-hidden" id="precios"
    >
      <div className="max-w-6xl mx-auto relative group">

        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-sm font-black uppercase tracking-[0.4em] mb-6"
          >
            Precios Claros
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8 }}
             className="font-display font-extrabold text-5xl md:text-7xl text-white mb-8 tracking-tighter"
          >
            Transparente.
            <br />
            <span className="text-[#9585B8] opacity-60">Sin sorpresas.</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ delay: 0.2 }}
             className="text-[#9585B8] text-xl font-medium tracking-tight"
          >
            Menos de lo que pierdes en un día sin sistema.
          </motion.p>
        </div>

        {/* Banner "todos incluyen" SV style */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           className="flex flex-wrap items-center justify-center gap-8 mb-16
                        px-10 py-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-3xl"
        >
          <span className="text-xs font-black text-[#9585B8] uppercase tracking-[0.3em]">
            Todos los planes incluyen:
          </span>
          <div className="flex flex-wrap justify-center gap-6">
            {INCLUYE_TODOS.map(item => (
              <div key={item} className="flex items-center gap-3 group">
                <div className="w-5 h-5 rounded-full bg-[#00E5CC20] flex items-center justify-center transition-colors group-hover:bg-[#00E5CC40]">
                  <span className="text-[#00E5CC] text-[10px] font-black">✓</span>
                </div>
                <span className="text-xs font-bold text-[#F4EDFF] tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cards de precios premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {PLANES.map(({ name, price, desc, popular, color, features }, i) => (
            <motion.div 
                 key={name}
                 initial={{ opacity: 0, y: 40, scale: 0.95 }}
                 animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                 transition={{ delay: 0.3 + (i * 0.2), duration: 0.7 }}
                 whileHover={{ y: -10, scale: 1.02 }}
                 className={`relative rounded-[3rem] p-12 flex flex-col transition-all overflow-hidden ${
                   popular
                     ? 'bg-[#110B1A] border-2 border-[rgba(224,64,251,0.5)] shadow-[0_0_80px_rgba(224,64,251,0.25)]'
                     : 'bg-[#110B1A] border border-white/15 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'
                 }`}
            >
              {/* Glow interno para el popular */}
              {popular && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E040FB20] blur-[100px] pointer-events-none" />
              )}

              {/* Badge popular pro */}
              {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <motion.div 
                     animate={{ scale: [1, 1.05, 1] }} 
                     transition={{ duration: 2, repeat: Infinity }}
                     className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em]
                                  bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-[0_10px_30px_rgba(224,64,251,0.4)]"
                  >
                    ⭐ MÁS ELEGIDO
                  </motion.div>
                </div>
              )}

              {/* Contenido pro */}
              <div className="mb-10 relative z-10">
                <div className="font-display font-black text-3xl text-white mb-3 tracking-tighter">{name}</div>
                <div className="text-base font-medium text-[#9585B8] leading-relaxed opacity-80">{desc}</div>
              </div>

              {/* Precio SV style */}
              <div className="mb-12 relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-7xl text-white tracking-tighter">
                    ${price}
                  </span>
                  <span className="text-[#9585B8] text-xl font-black opacity-60">/mes</span>
                </div>
                <div className="text-xs font-black text-[#9585B8] mt-4 uppercase tracking-[0.2em] opacity-40">
                  Pago mensual · Cancela cuando quieras
                </div>
              </div>

              {/* CTA focalizado */}
              <motion.a 
                 href="https://wa.me/584240000000?text=Quiero%20contratar%20LUMIS"
                 target="_blank"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.98 }}
                 className={`w-full py-6 rounded-2xl text-base font-black text-center
                             mb-12 transition-all block relative z-10 tracking-tight ${
                   popular
                     ? 'bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-[0_20px_40px_rgba(224,64,251,0.4)]'
                     : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                 }`}
              >
                OBTENER ACCESO INMEDIATO →
              </motion.a>

              {/* Features pro con diseño focalizado */}
              <div className="space-y-4 flex-1 relative z-10">
                {features.map((f, i) => (
                  <motion.div 
                     key={f} 
                     initial={{ opacity: 0, x: -10 }}
                     animate={isInView ? { opacity: 1, x: 0 } : {}}
                     transition={{ delay: 1 + (i * 0.05) }}
                     className="flex items-start gap-4 group/item"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center
                                    flex-shrink-0 mt-1 transition-transform group-hover/item:scale-125"
                         style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <span className="text-[10px] font-black" style={{ color }}>✓</span>
                    </div>
                    <span className="text-sm font-bold text-[#9585B8] group-hover/item:text-white transition-colors tracking-tight">{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparativa focalizada */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 2 }}
            className="text-center mt-12 px-6 py-4 rounded-2xl bg-[#00E5CC05] border border-[#00E5CC15] max-w-2xl mx-auto"
        >
          <p className="text-xs font-black text-[#00E5CC] uppercase tracking-widest opacity-80">
            LUMIS incluye portal de pago, semilla diaria y escáner por el mismo precio que otros ERPs básicos.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
