'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Play } from 'lucide-react'

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
      className="relative min-h-[90vh] md:min-h-screen flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden bg-white"
    >
      {/* Glow sutil sobre blanco */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E040FB]/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#7C4DFF]/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.02] pointer-events-none" />

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
          <span className="text-[10px] font-bold text-[#E040FB] tracking-[0.2em] uppercase font-outfit">
            🇻🇪 Hecho por Venezolanos para Venezolanos
          </span>
        </motion.div>

        {/* Headline Refinado (Outfit + Zilla Slab) */}
        <div className="font-outfit font-bold text-[42px] md:text-[68px] leading-[1.1] tracking-tight mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-900"
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
            className="text-slate-400"
          >
            Y no sabes por qué.
          </motion.div>
        </div>

        {/* Subtexto (Zilla Slab) */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="font-zilla text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          WhatsApp, cuadernos y Excel no escalan un negocio. Mientras el{' '}
          <span className="text-slate-800 font-semibold border-b border-slate-300">BCV cambia cada día</span>, tus{' '}
          <span className="text-slate-800 font-semibold border-b border-slate-300">cuentas por cobrar</span> crecen sin control,
          y tus clientes pagan cuando quieren. Es hora de tomar el mando.
        </motion.p>

        {/* CTAs (Compactos para estar "Above the fold") */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <motion.a
            href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20quiero%20una%20demo"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white font-outfit bg-[#25D366] hover:bg-[#1da851] shadow-[0_8px_30px_rgba(37,211,102,0.3)] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Hablar por WhatsApp
          </motion.a>

          <motion.a
            href="#funciones"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold font-outfit text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all group"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-[#E040FB]/10 transition-all">
              <Play className="w-2.5 h-2.5 fill-current text-slate-500" />
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
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
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
          <p className="font-zilla text-sm text-slate-500">
            <span className="text-slate-800 font-semibold">
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
