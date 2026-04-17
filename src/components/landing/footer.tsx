'use client'
import Link from 'next/link'
import { Heart, Mail, MessageCircle, Instagram } from 'lucide-react'
import { LumisLogo } from './lumis-logo'

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Funciones', href: '#funciones' },
  { label: 'Precios', href: '#precios' },
  { label: 'Preguntas frecuentes', href: '#faq' },
]

const LEGAL_LINKS = [
  { label: 'Términos de servicio', href: '/terminos' },
  { label: 'Política de privacidad', href: '/privacidad' },
  { label: 'Cookies', href: '/cookies' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative bg-slate-950 border-t border-white/5 overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#A855F7]/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          {/* Brand column — 2 cols en lg */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <LumisLogo size={42} textClassName="text-white" />
            </Link>
            <p className="font-zilla text-sm text-white/60 leading-relaxed max-w-sm mb-6">
              El ERP/CRM hecho para Venezuela. Factura, cobra y controla tu
              inventario — con tasa BCV automática y desde{' '}
              <span className="text-white font-semibold">$19.99/mes</span>.
            </p>

            {/* Contact buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                href="https://wa.me/584149406419?text=Hola%20LUMIS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp
              </a>
              <a
                href="mailto:hola@uselumisapp.com"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
              <a
                href="https://instagram.com/uselumisapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
              Producto
            </h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/register"
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  Empezar demo
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20quiero%20info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  Contactar ventas
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/584149406419?text=Hola%20LUMIS%2C%20necesito%20soporte"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  Soporte
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40 font-medium order-2 sm:order-1">
            © {year} LUMIS. Todos los derechos reservados.
          </p>

          <p className="text-xs text-white/60 font-medium flex items-center gap-1.5 order-1 sm:order-2">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899] animate-pulse" />
            <span>en Venezuela 🇻🇪</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
