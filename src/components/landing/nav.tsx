'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
 
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
 
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
 
  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        px-6 md:px-12 h-[64px]
        transition-all duration-300
        ${scrolled
          ? 'bg-[#08050F]/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
        }
      `}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="
          w-8 h-8 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
          shadow-[0_0_20px_rgba(224,64,251,0.40)]
        ">
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="
          font-display font-bold text-[17px] text-white tracking-tight
        ">
          LUMIS
        </span>
      </Link>
 
      {/* Links centro */}
      <div className="hidden md:flex items-center gap-8">
        {['Funciones', 'Precios', 'Clientes'].map(item => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-sm text-[#9585B8] hover:text-white transition-colors font-medium"
          >
            {item}
          </a>
        ))}
      </div>
 
      {/* CTAs */}
      <div className="flex items-center gap-3">
        <a
          href="/login"
          className="hidden md:block text-sm text-[#9585B8] hover:text-white transition-colors font-medium"
        >
          Iniciar sesión
        </a>
        <a
          href="#contacto"
          className="
            flex items-center gap-2 px-5 py-2 rounded-xl
            text-sm font-bold text-white
            bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
            shadow-[0_4px_16_rgba(224,64,251,0.30)]
            hover:shadow-[0_4px_24px_rgba(224,64,251,0.50)]
            hover:opacity-90 transition-all duration-200
          "
        >
          Solicitar acceso
        </a>
      </div>
    </nav>
  )
}
