'use client'
import { Nav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { Problem } from '@/components/landing/problem'
import { ProductShowcase } from '@/components/landing/product-showcase'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Differentiator } from '@/components/landing/differentiator'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { CTAFinal } from '@/components/landing/cta-final'
import { Footer } from '@/components/landing/footer'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Si Supabase hizo un fallback al Site URL por falta de configuración de Redirect URLs en el backend,
    // interceptamos el hash (que se arrastró desde root `page.tsx`)
    if (
      typeof window !== 'undefined' &&
      window.location.hash.includes('access_token') &&
      window.location.hash.includes('type=invite')
    ) {
      router.replace(`/auth/confirm`)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-white selection:bg-[#E040FB]/30 selection:text-slate-900 overflow-x-hidden">
      <Nav />
      <Hero />
      <Problem />
      <ProductShowcase />
      <HowItWorks />
      <Differentiator />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
