'use client'
import { useState, useRef } from 'react'
import {
  LayoutDashboard, ShoppingCart, CreditCard,
  Package, Globe, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Todo tu negocio en una pantalla',
    desc: 'KPIs en tiempo real, tasa BCV automática, cartera vencida y alertas de inventario. El pulso de tu empresa al abrir el sistema.',
    color: '#E040FB'
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ShoppingCart,
    title: 'De la orden a la factura en segundos',
    desc: 'Crea pedidos, asigna vendedores, calcula totales en Bs. y USD. Compatible con pistolas de código de barras.',
    color: '#7C4DFF'
  },
  {
    id: 'cobranza',
    label: 'Cobranza',
    icon: CreditCard,
    title: 'Semáforo de crédito para cada cliente',
    desc: 'Verde, amarillo o rojo según su deuda. Bloquea pedidos a clientes morosos. Registra pagos por Zelle, Pago Móvil, efectivo y más.',
    color: '#FFB800'
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Package,
    title: 'Stock en tiempo real, en todas tus sedes',
    desc: 'Inventario multi-sede consolidado. Alertas de quiebre, movimientos y ajustes. Compatible con escáner de barras.',
    color: '#00E5CC'
  },
  {
    id: 'portal',
    label: 'Portal de Pago',
    icon: Globe,
    title: 'Tu cliente ve lo que debe, sin llamarte',
    desc: 'Cada cliente tiene su portal personal. Ve sus facturas, registra su pago con foto de referencia. Tú confirmas en segundos.',
    color: '#4FC3F7'
  },
  {
    id: 'semilla',
    label: 'Semilla Diaria',
    icon: Sparkles,
    title: 'El detalle que fideliza clientes',
    desc: 'Cada día, tus clientes abren LUMIS y encuentran un mensaje motivacional personalizado para su negocio. Nadie más hace esto.',
    color: '#E040FB'
  },
]

export function ProductShowcase() {
  const [active, setActive] = useState('dashboard')
  const tab = TABS.find(t => t.id === active)!
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section 
      ref={ref}
      className="py-32 px-6 bg-[#08050F]"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header con diseño focalizado */}
        <div className="text-center mb-24">
          <motion.p 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={isInView ? { opacity: 1, scale: 1 } : {}}
             className="text-[#E040FB] text-sm font-bold uppercase tracking-[0.3em] mb-6"
          >
            Funcionalidades Premium
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             animate={isInView ? { opacity: 1, y: 0 } : {}}
             transition={{ duration: 0.8 }}
             className="font-display font-bold text-5xl md:text-7xl text-white tracking-tighter"
          >
            Todo lo que necesita tu negocio.
            <br />
            <span className="text-[#9585B8] opacity-60">Nada que no necesitas.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">

          {/* Tabs verticales SV style */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scroll-smooth no-scrollbar"
          >
            {TABS.map((t, i) => {
              const Icon = t.icon
              const isActive = t.id === active
              return (
                <button 
                  key={t.id} 
                  onClick={() => setActive(t.id)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-left 
                              transition-all flex-shrink-0 lg:flex-shrink w-full group relative ${
                          isActive
                            ? 'bg-gradient-to-r from-[rgba(255,255,255,0.08)] to-transparent border border-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                            : 'text-[#9585B8] hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? '' : 'group-hover:text-white'}`} style={{ color: isActive ? t.color : '' }} />
                  <span className="text-base font-bold tracking-tight">{t.label}</span>
                  
                  {isActive && (
                    <motion.div 
                       layoutId="tabindicator"
                       className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-full" 
                       style={{ backgroundColor: t.color }}
                    />
                  )}
                </button>
              )
            })}
          </motion.div>

          {/* Preview interactiva */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={active}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-[#110B1A] border border-white/10 rounded-[2.5rem] p-10 md:p-16
                          min-h-[500px] flex flex-col justify-between shadow-[0_60px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden"
            >
              {/* Fondo decorativo de tab */}
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                 <tab.icon className="w-64 h-64" style={{ color: tab.color }} />
              </div>

              <div className="relative z-10 flex flex-col justify-center h-full">
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
                   style={{ backgroundColor: `${tab.color}15`, border: `2px solid ${tab.color}30` }}
                >
                  <tab.icon className="w-8 h-8" style={{ color: tab.color }} />
                </motion.div>
                
                <h3 className="font-display font-bold text-4xl md:text-5xl text-white mb-6 leading-tight tracking-tighter">
                  {tab.title}
                </h3>
                <p className="text-[#9585B8] text-xl leading-relaxed max-w-2xl font-body font-medium mb-12">
                  {tab.desc}
                </p>

                {/* Simulación visual pro */}
                <div className="bg-[#18102A]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tab.color }} />
                    <span className="text-xs text-[#9585B8] font-extrabold uppercase tracking-[0.3em]">
                      Acceso rápido — {active}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {[90, 75, 85].map((w, i) => (
                      <motion.div 
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${w}%` }}
                        transition={{ delay: 0.2 + (i * 0.1), duration: 1, ease: 'circOut' }}
                        className="h-3 rounded-full bg-white/5 relative overflow-hidden"
                      >
                         <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-20"
                         />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
