'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-[100]
        flex items-center justify-between
        px-6 md:px-12 h-[72px]
        transition-all duration-500
        ${scrolled
          ? 'bg-[#08050F]/70 backdrop-blur-xl border-b border-white/5 py-4'
          : 'bg-transparent py-6'
        }
      `}
    >
      {/* Logo izquierda */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="
          w-9 h-9 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
          shadow-[0_0_20px_rgba(224,64,251,0.3)]
          transition-transform duration-300 group-hover:scale-110
        ">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="
          font-display font-bold text-xl text-white tracking-tight
        ">
          LUMIS
        </span>
      </Link>

      {/* Links centro (desktop) */}
      <div className="hidden md:flex items-center gap-10">
        {['Funciones', 'Precios', 'Clientes'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-[13px] text-[#9585B8] hover:text-white transition-colors font-medium tracking-wide uppercase"
          >
            {item}
          </a>
        ))}
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-6">
        <a
          href="/login"
          className="hidden md:block text-[13px] text-[#9585B8] hover:text-white transition-colors font-medium tracking-wide uppercase"
        >
          Iniciar sesión
        </a>
        <motion.a
          href="https://wa.me/584240000000"
          target="_blank"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            px-6 py-2.5 rounded-xl
            text-[13px] font-bold text-white uppercase tracking-wider
            bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
            shadow-[0_4px_20px_rgba(224,64,251,0.25)]
            hover:shadow-[0_4px_30px_rgba(224,64,251,0.4)]
            transition-all duration-300
          "
        >
          Solicitar acceso
        </motion.a>
      </div>
    </nav>
  )
}
