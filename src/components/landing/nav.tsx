'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LINKS = [
  { label: 'Funciones',  href: '#funciones'  },
  { label: 'Precios',    href: '#precios'    },
  { label: 'Para quién', href: '#industrias' },
  { label: 'FAQ',        href: '#faq'        },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'circOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08050F]/80 backdrop-blur-xl border-b border-white/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center
                          bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                          shadow-[0_0_20px_rgba(224,64,251,0.35)]
                          relative overflow-hidden"
          >
            <Shield className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
            <motion.div 
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            LUMIS
          </span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(l => (
            <Link 
              key={l.href} 
              href={l.href}
              className="px-4 py-2 text-sm text-[#9585B8] hover:text-white transition-colors font-medium relative group"
            >
              {l.label}
              <motion.span 
                className="absolute bottom-1 left-4 right-4 h-px bg-[#E040FB] origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <Link href="/login"
                className="hidden md:block text-sm text-[#9585B8] hover:text-white
                           transition-colors font-medium">
            Iniciar sesión
          </Link>
          <motion.a 
            href="https://wa.me/584240000000?text=Hola,%20quiero%20saber%20más%20de%20LUMIS"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                       text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                       shadow-[0_0_20px_rgba(224,64,251,0.30)]
                       hover:shadow-[0_0_30px_rgba(224,64,251,0.50)] transition-all"
          >
            Solicitar Demo →
          </motion.a>
        </div>
      </div>
    </motion.header>
  )
}
