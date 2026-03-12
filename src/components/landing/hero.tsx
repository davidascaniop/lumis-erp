'use client'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'

function NumberCounter({ target, duration = 2 }: { target: number, duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let start = 0
      const end = target
      if (start === end) return
      
      let totalMiliseconds = duration * 1000
      let incrementTime = (totalMiliseconds / end)
      
      let timer = setInterval(() => {
        start += 1
        setCount(start)
        if (start === end) clearInterval(timer)
      }, incrementTime)
      
      return () => clearInterval(timer)
    }
  }, [isInView, target, duration])

  return <span ref={ref}>{count}</span>
}

export function Hero() {
  const containerRef = useRef(null)
  
  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] md:min-h-screen flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden bg-[#08050F]"
    >
      {/* ══════════════════════════════════════════
          FONDO
          ══════════════════════════════════════════ */}
      
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E040FB]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#7C4DFF]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1525_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none" />

      {/* ══════════════════════════════════════════
          CONTENIDO
          ══════════════════════════════════════════ */}
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        {/* Badge Sutil */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6
                     bg-[#E040FB]/5 border border-[#E040FB]/10 backdrop-blur-sm"
        >
          <span className="text-[10px] font-bold text-[#E040FB]/80 tracking-[0.2em] uppercase font-outfit">
            ⚡ Hecho en Venezuela para el mundo
          </span>
        </motion.div>

        {/* Headline Refinado (Outfit + Zilla Slab) */}
        <div className="font-outfit font-bold text-[42px] md:text-[68px] leading-[1.1] tracking-tight mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white"
          >
            Vendes mucho.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#E040FB] font-zilla italic font-medium"
          >
            Cobras poco.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/60"
          >
            Y no sabes por qué.
          </motion.div>
        </div>

        {/* Subtexto (Zilla Slab) */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="font-zilla text-lg md:text-xl text-[#9585B8] max-w-2xl mx-auto mb-10 leading-relaxed opacity-90"
        >
          WhatsApp, cuadernos y Excel no escalan un negocio. Mientras el{' '}
          <span className="text-white border-b border-white/20">BCV cambia</span>, tus{' '}
          <span className="text-white border-b border-white/20">cuentas por cobrar</span> crecen sin control. 
          Es hora de tomar el mando.
        </motion.p>

        {/* CTAs (Compactos para estar "Above the fold") */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <motion.a 
            href="https://wa.me/584240000000"
            target="_blank"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-xl text-base font-bold text-white font-outfit
                       bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                       shadow-[0_8px_30px_rgba(224,64,251,0.25)]"
          >
            Solicitar acceso →
          </motion.a>
          
          <motion.a 
            href="#funciones"
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold font-outfit
                       text-[#F4EDFF]/80 bg-white/[0.02] border border-white/5 transition-all group"
          >
             <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#E040FB]/10 transition-all">
                <Play className="w-2.5 h-2.5 fill-current" />
             </div>
             Ver cómo funciona
          </motion.a>
        </motion.div>

        {/* Social Proof (Sutil) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex -space-x-2">
            {['A', 'J', 'M', 'R', 'E'].map((char, i) => (
              <div 
                key={i}
                className="w-8 h-8 rounded-full border border-[#08050F] flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                style={{
                  background: [
                    'linear-gradient(135deg, #E040FB, #7C4DFF)',
                    'linear-gradient(135deg, #00E5CC, #7C4DFF)',
                    'linear-gradient(135deg, #7C4DFF, #4FC3F7)',
                    'linear-gradient(135deg, #E040FB, #FF2D55)',
                    'linear-gradient(135deg, #FFB800, #E040FB)',
                  ][i]
                }}
              >
                {char}
              </div>
            ))}
          </div>
          <p className="font-zilla text-sm text-[#9585B8] opacity-70">
            <span className="text-white/80 font-medium">
              +<NumberCounter target={200} /> negocios
            </span> ya automatizaron su flujo
          </p>
        </motion.div>

      </div>

      {/* Scroll indicator (Sutil) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#E040FB] to-transparent" />
      </motion.div>
    </section>
  )
}
