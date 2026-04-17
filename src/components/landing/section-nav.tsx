'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

const SECTIONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'problema', label: 'Problema' },
  { id: 'funciones', label: 'Soluciones' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'por-que-lumis', label: 'Por qué LUMIS' },
  { id: 'precios', label: 'Precios' },
  { id: 'faq', label: 'FAQ' },
]

/**
 * Side navigation con dots flotantes que:
 *  · Muestra una pastilla por cada sección de la landing
 *  · Resalta la sección actualmente visible en el viewport (IntersectionObserver)
 *  · Permite click para smooth-scroll a cualquier sección
 *  · Muestra el label de la sección al hacer hover
 *  · Se oculta en mobile (desktop-only, >= lg)
 *  · Se muestra solo después de hacer scroll fuera del hero (>200px)
 *  · Incluye un "back to top" botón al final
 */
export function SectionNav() {
  const [activeId, setActiveId] = useState<string>('hero')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Aparece después de hacer scroll un poco
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Detecta qué sección está visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        // Activa cuando la sección cruza el 40% superior del viewport
        rootMargin: '-40% 0px -50% 0px',
        threshold: 0,
      },
    )

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollTo = (id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -80 // compensa el nav fijo
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-2"
          aria-label="Navegación de secciones"
        >
          {/* Contenedor glass con subtle bg */}
          <div className="flex flex-col gap-1 py-3 px-2 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-lg">
            {SECTIONS.map((section) => {
              const isActive = activeId === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className="group relative flex items-center justify-end"
                  aria-label={`Ir a ${section.label}`}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {/* Label (visible on hover) */}
                  <span
                    className={`absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold tracking-wide shadow-xl transition-all duration-200 pointer-events-none ${
                      isActive
                        ? 'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0'
                        : 'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0'
                    }`}
                  >
                    {section.label}
                    {/* Arrow */}
                    <span className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-slate-900" />
                  </span>

                  {/* Dot */}
                  <div
                    className={`relative flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'w-6 h-6' : 'w-6 h-6'
                    }`}
                  >
                    <motion.div
                      layout
                      className={`rounded-full transition-all duration-300 ${
                        isActive
                          ? 'w-2.5 h-2.5 bg-gradient-to-br from-[#EC4899] via-[#A855F7] to-[#6366F1] shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                          : 'w-1.5 h-1.5 bg-slate-300 group-hover:bg-slate-500 group-hover:scale-125'
                      }`}
                    />
                    {/* Pulsing ring around active */}
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7]"
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Back to top button */}
          <motion.button
            onClick={() => scrollTo('hero')}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#EC4899] via-[#A855F7] to-[#6366F1] shadow-[0_8px_24px_rgba(168,85,247,0.35)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.5)] transition-shadow"
            aria-label="Volver arriba"
          >
            <ArrowUp className="w-4 h-4 text-white" strokeWidth={3} />

            {/* Tooltip */}
            <span className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold tracking-wide shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Volver arriba
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-slate-900" />
            </span>
          </motion.button>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
