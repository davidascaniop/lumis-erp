'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  Check,
  Sparkles,
  Rocket,
  Gift,
  Star,
  Crown,
  Clock,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'
import { useBCV } from '@/hooks/use-bcv'

// ══════════════════════════════════════════════════════════════════════
// PLANS DATA
// ══════════════════════════════════════════════════════════════════════

type Plan = {
  id: string
  name: string
  tagline: string
  price: number
  icon: React.ComponentType<{ className?: string }>
  highlight: boolean
  badge?: string
  features: string[]
  cta: {
    label: string
    href: string
    external?: boolean
    variant: 'primary' | 'outline' | 'soft'
  }
  accent: string
  gradientFrom: string
  gradientTo: string
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Para el que arranca',
    price: 19.99,
    icon: Rocket,
    highlight: false,
    features: [
      'Facturación en USD y Bs.',
      'Hasta 500 productos',
      '1 sucursal · 1 usuario admin',
      '50 clientes con cuentas por cobrar',
      'BCV automático',
      'Reportes básicos',
      'Soporte por WhatsApp',
    ],
    cta: {
      label: 'Empezar con Starter',
      href: '/register',
      variant: 'outline',
    },
    accent: 'text-slate-900',
    gradientFrom: '#94A3B8',
    gradientTo: '#64748B',
  },
  {
    id: 'pro',
    name: 'Pro Business',
    tagline: 'Para el que crece',
    price: 79.99,
    icon: Star,
    highlight: true,
    badge: 'Más popular',
    features: [
      'TODO lo de Starter, más:',
      'Productos y clientes ilimitados',
      'Hasta 5 usuarios (vendedores)',
      'CRM avanzado · Pipeline de ventas',
      'Integración WhatsApp nativa',
      'Comisiones por vendedor',
      'Soporte prioritario',
    ],
    cta: {
      label: 'Empezar con Pro',
      href: '/register',
      variant: 'primary',
    },
    accent: 'text-[#A855F7]',
    gradientFrom: '#EC4899',
    gradientTo: '#A855F7',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Para el que domina',
    price: 119.99,
    icon: Crown,
    highlight: false,
    features: [
      'TODO lo de Pro, más:',
      'Multi-sucursal ilimitada',
      'Usuarios ilimitados',
      'Multi-depósito sincronizado',
      'API para integraciones',
      'Reportes consolidados',
      'Account Manager dedicado · VIP 24/7',
    ],
    cta: {
      label: 'Empezar con Enterprise',
      href: '/register',
      variant: 'outline',
    },
    accent: 'text-[#6366F1]',
    gradientFrom: '#7C4DFF',
    gradientTo: '#6366F1',
  },
]

// ══════════════════════════════════════════════════════════════════════
// CURRENCY TOGGLE
// ══════════════════════════════════════════════════════════════════════

function CurrencyToggle({
  currency,
  setCurrency,
}: {
  currency: 'USD' | 'BS'
  setCurrency: (c: 'USD' | 'BS') => void
}) {
  return (
    <div className="inline-flex bg-white border border-slate-200 rounded-full p-1 shadow-sm">
      {(['USD', 'BS'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`relative px-5 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all ${
            currency === c ? 'text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {currency === c && (
            <motion.div
              layoutId="currency-pill"
              className="absolute inset-0 bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] rounded-full shadow-sm"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">
            {c === 'USD' ? '💵 USD' : '🇻🇪 Bs.'}
          </span>
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

export function Pricing() {
  const [currency, setCurrency] = useState<'USD' | 'BS'>('USD')
  const { rate } = useBCV()

  const formatPrice = (usd: number) => {
    if (currency === 'USD') {
      return `$${usd.toFixed(2)}`
    }
    if (rate) {
      return `Bs. ${Math.round(usd * rate).toLocaleString('es-VE')}`
    }
    return `$${usd.toFixed(2)}`
  }

  return (
    <section
      id="precios"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-white"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#E040FB_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#A855F7]/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 bg-gradient-to-r from-[#EC4899]/10 to-[#6366F1]/10 border border-[#A855F7]/20"
          >
            <Sparkles className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[9px] sm:text-[10px] font-bold text-[#A855F7] tracking-[0.15em] sm:tracking-[0.18em] uppercase font-outfit">
              Precios
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit font-bold text-[32px] sm:text-[42px] md:text-[52px] leading-[1.1] tracking-tight mb-5 text-slate-900 max-w-3xl mx-auto"
          >
            Precios que{' '}
            <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium">
              no te van a asustar.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-zilla text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Sin letra chica. Sin contratos de 12 meses. Sin sorpresas al mes 3.
            Paga mientras te funciona, cancela cuando quieras.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CurrencyToggle currency={currency} setCurrency={setCurrency} />
          </motion.div>
        </div>

        {/* ─── DEMO CARD (destacada) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
          className="relative mb-12 sm:mb-16"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-[#EC4899]/10 via-[#A855F7]/10 to-[#6366F1]/10 border-2 border-[#A855F7]/30 overflow-hidden p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.25)]">
            {/* Sparkle bg */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#EC4899]/20 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#6366F1]/15 to-transparent rounded-tr-full pointer-events-none" />

            <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#A855F7]/30 shadow-sm mb-4">
                  <Gift className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span className="text-[10px] font-black text-[#A855F7] tracking-widest uppercase">
                    Prueba sin pagar
                  </span>
                </div>

                <h3 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-slate-900 mb-3">
                  15 días{' '}
                  <span className="inline-block bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent font-zilla italic font-medium pr-2">
                    gratis
                  </span>
                  <br />
                  con acceso total.
                </h3>

                <p className="font-zilla text-base sm:text-lg text-slate-600 leading-relaxed mb-5 max-w-md">
                  Prueba todo LUMIS Enterprise sin tarjeta, sin compromiso,
                  sin spam. Si te gusta, eliges tu plan. Si no, no pasa nada.
                </p>

                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-black text-white bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:shadow-[0_14px_40px_rgba(168,85,247,0.55)] transition-all font-outfit active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  Empezar mi demo ahora
                  <ArrowRight className="w-5 h-5" />
                </motion.a>

                <p className="text-[11px] font-medium text-slate-500 mt-3">
                  Sin tarjeta · Sin compromiso · Sin spam
                </p>
              </div>

              {/* Lista de features incluidas */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Incluye
                </div>
                {[
                  'Acceso completo a TODO (como Enterprise)',
                  'Productos y clientes ilimitados',
                  'Facturación en USD y Bs. con BCV',
                  'CRM, Inventario, Finanzas y Cobranza',
                  'Soporte por WhatsApp',
                ].map((feat, i) => (
                  <motion.div
                    key={feat}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EC4899] to-[#A855F7] flex items-center justify-center shrink-0 mt-0.5">
                      <Check
                        className="w-3 h-3 text-white"
                        strokeWidth={3}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {feat}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 3 PLANES PAGOS ─── */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">
            O elige un plan
          </div>
          <div className="h-px max-w-xs mx-auto bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={`relative ${plan.highlight ? 'lg:-mt-4 lg:-mb-4' : ''}`}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] rounded-full shadow-[0_4px_20px_rgba(168,85,247,0.4)]">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.18em]">
                        {plan.badge}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div
                  className={`h-full rounded-3xl p-6 sm:p-8 flex flex-col ${
                    plan.highlight
                      ? 'bg-gradient-to-br from-[#EC4899]/5 via-white to-[#6366F1]/5 border-2 border-[#A855F7]/40 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.25)]'
                      : 'bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow'
                  }`}
                >
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-outfit font-bold text-lg text-slate-900 leading-tight">
                        {plan.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {plan.tagline}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-outfit font-black text-4xl sm:text-5xl leading-none tracking-tight ${
                          plan.highlight
                            ? 'bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">
                        /mes
                      </span>
                    </div>
                    {currency === 'BS' && rate && (
                      <div className="text-[11px] text-slate-400 font-medium mt-1">
                        ≈ ${plan.price.toFixed(2)} USD
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.highlight
                              ? 'bg-gradient-to-br from-[#EC4899] to-[#A855F7]'
                              : 'bg-slate-100'
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 ${
                              plan.highlight ? 'text-white' : 'text-slate-600'
                            }`}
                            strokeWidth={3}
                          />
                        </div>
                        <span
                          className={`${
                            feat.startsWith('TODO')
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-600'
                          }`}
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.a
                    href={plan.cta.href}
                    target={plan.cta.external ? '_blank' : undefined}
                    rel={plan.cta.external ? 'noopener noreferrer' : undefined}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black transition-all font-outfit active:scale-95 ${
                      plan.cta.variant === 'primary'
                        ? 'bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.5)]'
                        : plan.cta.variant === 'soft'
                        ? 'bg-gradient-to-r from-[#6366F1]/10 to-[#7C4DFF]/10 text-[#6366F1] border border-[#6366F1]/30 hover:bg-[#6366F1]/15'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {plan.cta.variant === 'soft' && (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {plan.cta.label}
                    {plan.cta.variant !== 'soft' && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </motion.a>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ─── Trust row ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Cancela cuando quieras
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            Sin permanencia
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            Soporte por WhatsApp
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Tus datos siempre son tuyos
          </span>
        </motion.div>
      </div>
    </section>
  )
}
