import { Nav }              from '@/components/landing/nav'
import { Hero }             from '@/components/landing/hero'
import { Stats }            from '@/components/landing/stats'
import { Problem }          from '@/components/landing/problem'
import { ProductShowcase }  from '@/components/landing/product-showcase'
import { Differentiator }   from '@/components/landing/differentiator'
import { HowItWorks }       from '@/components/landing/how-it-works'
import { Industries }       from '@/components/landing/industries'
import { Testimonials }     from '@/components/landing/testimonials'
import { Pricing }          from '@/components/landing/pricing'
import { FAQ }              from '@/components/landing/faq'
import { CTAFinal }         from '@/components/landing/cta-final'
import { Footer }           from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Problem />
        <ProductShowcase />
        <Differentiator />
        <HowItWorks />
        <Industries />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  )
}
