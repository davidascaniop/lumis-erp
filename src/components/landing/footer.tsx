'use client'
import Link from 'next/link'
import { Zap, Instagram, Linkedin, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#08050F] pt-32 pb-12 px-6 border-t border-white/5 relative overflow-hidden">
      {/* Decorative Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E040FB]/30 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-24">
          
          {/* Col 1 - Brand */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] shadow-[0_0_20px_rgba(224,64,251,0.2)]">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">LUMIS</span>
            </Link>
            
            <div className="space-y-4">
               <p className="text-lg font-medium text-[#F4EDFF]/90 italic tracking-tight">
                  Luz para tu negocio.
               </p>
               <p className="text-sm text-[#9585B8] leading-relaxed">
                  Hecho con ❤️ en Venezuela 🇻🇪 para emprendedores que no se rinden.
               </p>
               <a href="mailto:hola@lumis.app" className="block text-sm font-bold text-[#E040FB] hover:text-[#7C4DFF] transition-colors">
                  hola@lumis.app
               </a>
            </div>
          </div>

          {/* Col 2 - Producto */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.3em] mb-10">Producto</h4>
            <ul className="space-y-4">
              {['Funciones', 'Precios', 'Clientes', 'Changelog', 'Blog'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#9585B8] hover:text-white transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 - Soporte */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.3em] mb-10">Soporte</h4>
            <ul className="space-y-4">
              {['WhatsApp', 'Tutoriales', 'Centro de ayuda', 'Estado del sistema'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#9585B8] hover:text-white transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.3em] mb-10">Legal</h4>
            <ul className="space-y-4">
              {['Privacidad', 'Términos de uso', 'Cookies'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#9585B8] hover:text-white transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <p className="text-[11px] font-bold text-[#9585B8] uppercase tracking-[0.2em]">
              © 2025 LUMIS · TODOS LOS DERECHOS RESERVADOS
           </p>

           <div className="flex items-center gap-6">
              {[
                { icon: Instagram, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
              ].map((social, i) => (
                <Link 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#9585B8] hover:text-white hover:bg-white/10 transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
           </div>
        </div>
      </div>

      {/* Background Decorative Gradient */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#E040FB]/5 blur-[120px] rounded-full pointer-events-none" />
    </footer>
  )
}
