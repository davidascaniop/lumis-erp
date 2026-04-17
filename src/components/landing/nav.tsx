'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LumisLogo } from './lumis-logo'

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
        flex items-center justify-center sm:justify-start
        px-5 sm:px-8 md:px-12 h-[64px] sm:h-[72px]
        transition-all duration-200
        ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-sm'
            : 'bg-transparent'
        }
      `}
    >
      <Link
        href="/"
        className="flex items-center gap-2 group transition-transform duration-200 active:scale-95"
      >
        <LumisLogo size={38} />
      </Link>
    </nav>
  )
}
