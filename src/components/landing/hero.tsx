'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Play } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center
                        pt-32 pb-24 overflow-hidden"
    >

      {/* Fondo con glow animado */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Glow central */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.12, 0.18, 0.12]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[800px] rounded-full
                        bg-[radial-gradient(circle,rgba(224,64,251,0.15)_0%,transparent_70%)] blur-3xl" 
        />
        {/* Glow secundario */}
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.12, 0.08]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4
                        w-[600px] h-[600px] rounded-full
                        bg-[radial-gradient(circle,rgba(124,77,255,0.12)_0%,transparent_70%)] blur-3xl" 
        />
        {/* Grid dinámico */}
        <div className="absolute inset-0 opacity-[0.05]"
             style={{
               backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
               backgroundSize: '80px 80px'
             }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 text-center">

        {/* Badge animado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10
                        bg-[rgba(224,64,251,0.08)] border border-[rgba(224,64,251,0.20)]
                        shadow-[0_0_20px_rgba(224,64,251,0.1)] backdrop-blur-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-[#E040FB]" />
          </motion.div>
          <span className="text-sm font-bold text-[#E040FB] tracking-wide">
            Hecho para negocios venezolanos 🇻🇪
          </span>
        </motion.div>

        {/* Headline con efecto revelado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="font-display font-extrabold text-5xl sm:text-7xl lg:text-8xl text-white
                         leading-[1.1] tracking-tight mb-8">
            El ERP que entiende
            <br />
            <span className="bg-gradient-to-r from-[#E040FB] via-[#A37EF5] to-[#7C4DFF]
                             bg-clip-text text-transparent px-2">
              el dólar, el BCV
            </span>
            <br />
            y tu cartera.
          </h1>
        </motion.div>

        {/* Subheadline con entrada suave */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-2xl text-[#9585B8] max-w-3xl mx-auto mb-12
                      leading-relaxed font-body font-medium"
        >
          LUMIS centraliza tus pedidos, inventario y cobranza en un solo lugar. 
          Gestión inteligente con tasa BCV en tiempo real y portal de pago para tus clientes.
        </motion.p>

        {/* CTAs con hover SV style */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
        >
          <motion.a 
            href="https://wa.me/584240000000?text=Hola,%20quiero%20una%20demo%20de%20LUMIS"
            target="_blank"
            whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(224,64,251,0.5)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold
                        text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                        shadow-[0_0_40px_rgba(224,64,251,0.30)]
                        transition-all duration-300"
          >
            Empieza Gratis Ahora
            <ArrowRight className="w-6 h-6" />
          </motion.a>
          
          <motion.a 
            href="#funciones"
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold
                        text-[#F4EDFF] bg-white/5 border border-white/10 backdrop-blur-md
                        transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#E040FB]/20 transition-colors">
              <Play className="w-4 h-4 group-hover:fill-[#E040FB] transition-all" />
            </div>
            Ver funciones
          </motion.a>
        </motion.div>

        {/* Dashboard mockup con parallax y hover 3D */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1, ease: 'circOut' }}
          style={{ y, opacity, scale }}
          className="relative max-w-5xl mx-auto rounded-3xl group"
        >
          {/* Resplandor dinámico */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                          rounded-[2.2rem] blur opacity-25 group-hover:opacity-40 transition-opacity" />
          
          {/* Contenedor del mockup */}
          <div className="relative bg-[#110B1A] border border-white/10 rounded-[2rem]
                          overflow-hidden shadow-[0_60px_100px_rgba(0,0,0,0.8)]
                          backdrop-blur-xl">
            {/* Topbar simulado pro */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5
                            bg-[#08050F]/70">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#FF2D55] shadow-[0_0_10px_rgba(255,45,85,0.4)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.4)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#00E5CC] shadow-[0_0_10px_rgba(0,229,204,0.4)]" />
              </div>
              <div className="flex-1 max-w-md mx-8 h-8 bg-white/5 border border-white/5 rounded-xl flex items-center px-4">
                <div className="w-4 h-4 text-white/20 mr-2 border-2 border-current rounded-full" />
                <div className="h-2 w-32 bg-white/10 rounded-full" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10" />
            </div>

            {/* Content simulado con KPIs interactivos */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Ingresos hoy', value: '$2,480.00', color: '#E040FB', icon: Zap },
                  { label: 'Cartera total', value: '$45,220', color: '#FFB800', icon: Zap },
                  { label: 'Dólar BCV', value: '41.22 Bs', color: '#00E5CC', icon: Zap },
                  { label: 'Pedidos nuevos', value: '34', color: '#7C4DFF', icon: Zap },
                ].map((kpi, i) => (
                  <motion.div 
                    key={kpi.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + (i * 0.1) }}
                    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-5
                               shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                           style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                        <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                      </div>
                      <div className="text-[10px] font-bold text-[#00E5CC] bg-[#00E5CC]/10 px-2 py-1 rounded-lg">
                        +12.5%
                      </div>
                    </div>
                    <div className="font-mono text-2xl font-bold mb-1 text-white tracking-tighter">
                      {kpi.value}
                    </div>
                    <div className="text-xs font-bold text-[#9585B8] uppercase tracking-widest">{kpi.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Tabla de pedidos pro */}
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1.4 }}
                 className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden"
              >
                {[
                  { name: 'Distribuidora El Éxito C.A.', status: 'Pagado', amount: '$1,240.00', time: 'hace 2 min', color: '#00E5CC' },
                  { name: 'Abastos Los Dos Caminos', status: 'Pendiente', amount: '$320.50', time: 'hace 15 min', color: '#FFB800' },
                  { name: 'Mayorista Caracas 2024', status: 'Vencido', amount: '$2,100.00', time: 'hace 1 hora', color: '#FF2D55' },
                ].map((row, i) => (
                  <div key={i}
                       className="flex items-center justify-between px-6 py-5
                                  border-b border-white/[0.04] last:border-0 hover:bg-white/5 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-[#E040FB]">
                        {row.name[0]}
                      </div>
                      <div>
                        <div className="text-sm text-white font-bold">{row.name}</div>
                        <div className="text-[10px] text-[#9585B8] uppercase font-bold tracking-widest">{row.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div className="hidden sm:block">
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                             style={{ backgroundColor: `${row.color}15`, color: row.color, border: `1px solid ${row.color}30` }}>
                          {row.status}
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-white">
                        {row.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
