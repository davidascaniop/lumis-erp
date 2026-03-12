'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Zap, Shield, Search, Database, Globe } from 'lucide-react'

const TABS = [
  {
    id: 'inventory',
    label: 'Inventario',
    title: 'Control de Stock en Tiempo Real',
    desc: 'Escanea códigos de barras, gestiona sedes y recibe alertas de quiebre automáticamente.',
    icon: Database,
    color: '#E040FB',
  },
  {
    id: 'bcv',
    label: 'Tasa BCV',
    title: 'Actualización Automática',
    desc: 'Tus precios y deudas se recalculan en tiempo real con la tasa oficial cada 30 minutos.',
    icon: Zap,
    color: '#00E5CC',
  },
  {
    id: 'cartera',
    label: 'Cobranza',
    title: 'Cartera de Clientes Digital',
    desc: 'Semáforo de crédito para saber quién debe y hace cuánto. Recordatorios automáticos.',
    icon: Shield,
    color: '#7C4DFF',
  },
]

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 px-6 bg-[#08050F]">
      <div className="max-w-4xl mx-auto">

        <div className="mb-20 text-center">
          <motion.p 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="text-[#E040FB] text-[10px] font-bold uppercase tracking-[0.4em] mb-4"
          >
            Capabilities
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-display font-bold text-3xl md:text-5xl text-white mb-6 tracking-tight"
          >
            Todo lo que necesita tu negocio.
            <br />
            <span className="text-[#9585B8] opacity-60">Nada que no necesitas.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 items-start">
          {/* Tabs minimalistas */}
          <div className="space-y-3">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-left transition-all border
                              ${activeTab === i 
                                 ? 'bg-white/[0.03] border-white/10 text-white' 
                                 : 'bg-transparent border-transparent text-[#9585B8] opacity-60 hover:opacity-100 hover:bg-white/[0.02]'}`}
                >
                  <Icon className="w-4 h-4" style={{ color: activeTab === i ? tab.color : 'inherit' }} />
                  <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content area minimal */}
          <div className="relative bg-[#110B1A] border border-white/5 rounded-2xl p-8 overflow-hidden min-h-[350px]">
            <AnimatePresence mode="wait">
              {(() => {
                const ActiveIcon = TABS[activeTab].icon;
                return (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-6"
                         style={{ color: TABS[activeTab].color, border: `1px solid ${TABS[activeTab].color}20` }}>
                      <ActiveIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                       {TABS[activeTab].title}
                    </h3>
                    <p className="text-[#9585B8] text-base leading-relaxed opacity-80 mb-8 font-normal">
                       {TABS[activeTab].desc}
                    </p>
                    
                    <div className="h-40 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                       <div className="flex flex-col gap-2 w-full p-6 text-left">
                          <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                          <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                          <div className="h-2 w-3/4 bg-white/5 rounded-full opacity-50" />
                       </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            
            {/* Background decorative minimal */}
            <motion.div 
               animate={{ opacity: [0.1, 0.2, 0.1] }}
               className="absolute top-0 right-0 w-32 h-32 blur-[80px]"
               style={{ backgroundColor: TABS[activeTab].color }}
            />
          </div>
        </div>

      </div>
    </section>
  )
}
