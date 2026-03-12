'use client'
import { Nav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { PainNumbers } from '@/components/landing/pain-numbers'
import { Problem } from '@/components/landing/problem'
import { ProductShowcase } from '@/components/landing/product-showcase'
import { Differentiator } from '@/components/landing/differentiator'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Industries } from '@/components/landing/industries'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { CTAFinal } from '@/components/landing/cta-final'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#08050F] selection:bg-[#E040FB]/30 selection:text-white overflow-x-hidden">
      <Nav />
      <Hero />
      <PainNumbers />
      <Problem />
      <ProductShowcase />
      <Differentiator />
      <HowItWorks />
      <Industries />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
