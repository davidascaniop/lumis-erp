'use client'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden bg-[#08050F]"
    >
      {/* ══════════════════════════════════════════
          FONDO
          ══════════════════════════════════════════ */}
      
      {/* Orbe magenta centrado arriba */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#E040FB]/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Orbe violeta abajo izquierda */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#7C4DFF]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(#1A1525_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      {/* ══════════════════════════════════════════
          CONTENIDO
          ══════════════════════════════════════════ */}
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10
                     bg-[#E040FB]/5 border border-[#E040FB]/20 backdrop-blur-sm"
        >
          <span className="text-xs font-bold text-[#E040FB] tracking-[0.2em] uppercase">
            ⚡ HECHO PARA VENEZUELA POR VENEZOLANOS
          </span>
        </motion.div>

        {/* Headline */}
        <div className="font-display font-extrabold text-[56px] md:text-[88px] leading-[0.9] tracking-tighter mb-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white"
          >
            Vendes mucho.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#E040FB]"
            style={{ textShadow: '0 0 40px rgba(224,64,251,0.3)' }}
          >
            Cobras poco.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/70"
          >
            Y no sabes por qué.
          </motion.div>
        </div>

        {/* Subtexto */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-lg md:text-xl text-[#9585B8] max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Pedidos por WhatsApp, inventario en cuaderno, cobros en Excel — mientras el{' '}
          <span className="text-white">BCV cambia</span> y tus{' '}
          <span className="text-white">clientes te deben</span> desde hace meses. 
          Así no se escala un negocio.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
        >
          <motion.a 
            href="https://wa.me/584240000000"
            target="_blank"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-5 rounded-2xl text-lg font-bold text-white
                       bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                       shadow-[0_10px_40px_rgba(224,64,251,0.3)]"
          >
            Solicitar acceso →
          </motion.a>
          
          <motion.a 
            href="#funciones"
            whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.08)' }}
            className="flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold
                       text-[#F4EDFF] bg-white/[0.03] border border-white/10 transition-all font-body group"
          >
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#E040FB]/20 transition-all">
                <Play className="w-3.5 h-3.5 fill-current" />
             </div>
             Ver cómo funciona
          </motion.a>
        </motion.div>

        {/* Social Proof */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex -space-x-3">
            {['A', 'J', 'M', 'R', 'E'].map((char, i) => (
              <div 
                key={i}
                className="w-10 h-10 rounded-full border-2 border-[#08050F] flex items-center justify-center text-xs font-bold text-white shadow-xl"
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
          <div className="flex flex-col items-center">
            <div className="flex gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[#FFB800] text-sm">★</span>
              ))}
            </div>
            <p className="text-sm text-[#9585B8] tracking-tight">
              <span className="text-white font-bold tracking-normal">
                +<NumberCounter target={200} /> negocios
              </span> venezolanos ya dejaron el Excel
            </p>
          </div>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] text-[#9585B8] uppercase tracking-[0.4em] font-bold">SCROLL</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#E040FB] to-transparent animate-bounce" />
      </motion.div>
    </section>
  )
}
