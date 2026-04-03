'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { LayoutDashboard, ShoppingCart, ShieldCheck, Box, Globe, MessageSquareQuote } from 'lucide-react'

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard & KPIs',
    title: 'Visualiza la salud de tu negocio',
    desc: 'Métricas críticas, tasa BCV automática y gráficos de tendencia en tiempo real.',
    icon: LayoutDashboard,
    color: '#E040FB',
    mockup: {
       title: 'Resumen Ejecutivo',
       items: [
         { label: 'Ventas USD', val: '$12,450', change: '+12%', color: '#00E5CC' },
         { label: 'Ventas Bs.', val: 'Bs 513,189', change: '+8%', color: '#A37EF5' },
         { label: 'Tasa BCV', val: '41.22', change: 'Actualizado', color: '#FFB800' },
         { label: 'Cartera Vencida', val: '$2,100', change: '-5%', color: '#FF2D55' },
       ]
    }
  },
  {
    id: 'ventas',
    label: 'Pedidos & Ventas',
    title: 'Cierra ventas más rápido',
    desc: 'Crea presupuestos y facturas en segundos. Escanea productos con la cámara de tu teléfono.',
    icon: ShoppingCart,
    color: '#7C4DFF',
    mockup: {
       title: 'Nuevo Pedido #1024',
       items: [
         { label: 'Harina PAN 1kg', val: '24 unidades', change: '$28.80', color: '#F4EDFF' },
         { label: 'Aceite Mañanero', val: '12 unidades', change: '$36.00', color: '#F4EDFF' },
         { label: 'Arroz Primor', val: '48 unidades', change: '$52.80', color: '#F4EDFF' },
       ]
    }
  },
  {
    id: 'cartera',
    label: 'Cartera & Cobranza',
    title: 'Tu dinero bajo control',
    desc: 'Semáforo de crédito automático. Identifica quién te debe y cuánto tiempo lleva vencido.',
    icon: ShieldCheck,
    color: '#00E5CC',
    mockup: {
       title: 'Control de Cobranza',
       items: [
         { label: 'Distribuidora El Éxito', val: '$1,200', change: 'AL DÍA', color: '#00E5CC' },
         { label: 'Bodega Don Juan', val: '$450', change: '3 DÍAS', color: '#FFB800' },
         { label: 'MiniMarket Express', val: '$890', change: 'VENCIDO', color: '#FF2D55' },
       ]
    }
  },
  {
    id: 'inventario',
    label: 'Inventario',
    title: 'Cero faltantes',
    desc: 'Control multi-sede absoluto. Movimientos, ajustes y alertas de stock bajo automáticas.',
    icon: Box,
    color: '#FFB800',
    mockup: {
       title: 'Inventario Central',
       items: [
         { label: 'Stock Total', val: '4,520 skus', change: 'Normal', color: '#F4EDFF' },
         { label: 'Sede Caracas', val: '2,100 units', change: 'Activa', color: '#A37EF5' },
         { label: 'Sede Valencia', val: '1,420 units', change: 'Crítico', color: '#FF2D55' },
       ]
    }
  },
  {
    id: 'portal',
    label: 'Portal de Pago',
    title: 'Autoservicio para clientes',
    desc: 'Tus clientes pueden consultar sus facturas y reportar pagos sin llamarte por WhatsApp.',
    icon: Globe,
    color: '#A37EF5',
    mockup: {
       title: 'Vista del Cliente',
       items: [
         { label: 'Facturas Pendientes', val: '3', change: 'Ver todas', color: '#F4EDFF' },
         { label: 'Total a Pagar', val: '$512.00', change: 'Bs 21,104', color: '#E040FB' },
         { label: 'Último Pago', val: '$120.00', change: 'Procesado', color: '#00E5CC' },
       ]
    }
  },
  {
    id: 'semilla',
    label: 'Semilla Diaria',
    title: 'Inspiración cada mañana',
    desc: 'Un mensaje motivacional para ti y tu equipo al iniciar la jornada en el dashboard.',
    icon: MessageSquareQuote,
    color: '#E040FB',
    mockup: {
       title: 'Semilla del Día',
       items: [
         { label: '"La disciplina es el puente entre metas y logros."', val: 'Jim Rohn', change: 'Hoy', color: '#E040FB' },
       ]
    }
  },
]

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const ActiveIcon = TABS[activeTab].icon

  return (
    <section 
      ref={ref} 
      className="py-32 bg-slate-50 relative px-6"
      id="funciones"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-display font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight"
          >
            Todo lo que necesita tu negocio.
            <br />
            <span className="text-[#9585B8] opacity-50 font-medium">Nada que no necesitas.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-24 items-start">
          {/* Tabs Verticales */}
          <div className="flex flex-col gap-2">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`
                  group relative flex items-center gap-4 px-6 py-5 rounded-2xl text-left transition-all duration-300
                  ${activeTab === i 
                    ? 'bg-white/[0.04] border border-slate-200 shadow-2xl' 
                    : 'bg-transparent border border-transparent opacity-40 hover:opacity-80'
                  }
                `}
              >
                {activeTab === i && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-8 bg-[#E040FB] rounded-full" 
                  />
                )}
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-colors
                                group-hover:bg-white/10">
                  <tab.icon 
                    className="w-5 h-5 transition-colors" 
                    style={{ color: activeTab === i ? tab.color : 'inherit' }} 
                  />
                </div>
                <span className="font-bold text-sm tracking-tight">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Visual Showcase Area */}
          <div className="relative group/mockup">
            {/* Background Glow dinámico */}
            <motion.div 
               animate={{ 
                 backgroundColor: TABS[activeTab].color,
                 opacity: [0.05, 0.1, 0.05]
               }}
               className="absolute -inset-10 blur-[100px] rounded-full pointer-events-none"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'circOut' }}
                className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden"
              >
                 <div className="max-w-xl mb-12">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-slate-200 text-[10px] font-bold text-[#9585B8] uppercase tracking-widest mb-6">
                      Módulo seleccionado
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                      {TABS[activeTab].title}
                   </h3>
                   <p className="text-[#9585B8] text-lg leading-relaxed font-normal">
                      {TABS[activeTab].desc}
                   </p>
                 </div>

                 {/* Mockup UI Placeholder */}
                 <div className="bg-slate-50/50 border border-white/5 rounded-3xl p-6 md:p-10">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                       <span className="text-sm font-bold text-white tracking-tight">{TABS[activeTab].mockup.title}</span>
                       <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF2D55]/30" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]/30" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5CC]/30" />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {TABS[activeTab].mockup.items.map((item, idx) => (
                         <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors group/item">
                            <div className="flex items-center justify-between mb-3">
                               <div className="text-[10px] font-bold text-[#9585B8] uppercase tracking-widest">{item.label}</div>
                               <div className="text-[8px] font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.change}</div>
                            </div>
                            <div className="text-2xl font-mono font-bold text-white tracking-tighter group-hover/item:scale-105 transition-transform origin-left">{item.val}</div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Decoración grid interna */}
                 <div className="absolute inset-0 bg-[#E040FB]/[0.02] bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
