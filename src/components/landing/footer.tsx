'use client'
import Link from 'next/link'
import { Shield, Sparkles, Instagram, Twitter, Linkedin, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="bg-[#08050F] border-t border-white/5 py-24 px-6 relative overflow-hidden">
      
      {/* Glow secundario sutil en el footer */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-t from-[#E040FB05] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-24 mb-24">

          {/* Brand & Mission SV style */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3.5 mb-8 group">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: 'circOut' }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center
                              bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                              shadow-[0_0_30px_rgba(224,64,251,0.25)]"
              >
                <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="font-display font-black text-white text-2xl tracking-tighter">LUMIS</span>
            </Link>
            <p className="text-base text-[#9585B8] leading-relaxed mb-10 max-w-[280px] font-medium opacity-80">
              Luz para tu negocio y orden para tu cartera. ERP/CRM diseñado para la nueva era venezolana.
            </p>
            
            <div className="flex items-center gap-4">
               {[
                 { Icon: Instagram, href: '#' },
                 { Icon: Twitter, href: '#' },
                 { Icon: Linkedin, href: '#' },
                 { Icon: Mail, href: 'mailto:hola@lumis.app' },
               ].map((social, i) => (
                 <Link 
                   key={i} 
                   href={social.href} 
                   className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#E040FB15] hover:text-[#E040FB] transition-all border border-white/5 hover:border-[#E040FB30]"
                 >
                    <social.Icon className="w-5 h-5" />
                 </Link>
               ))}
            </div>
          </div>

          {/* Producto Links */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
               PRODUCTO
               <Sparkles className="w-4 h-4 text-[#A37EF5]" />
            </h4>
            <div className="space-y-5">
              {['Funciones', 'Precios', 'Para quién', 'Changelog'].map(l => (
                <a key={l} href="#"
                   className="block text-base text-[#9585B8] hover:text-white hover:translate-x-1 transition-all font-medium opacity-80 hover:opacity-100">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Soporte Links */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10">
               SOPORTE
            </h4>
            <div className="space-y-5">
              {['Tutoriales', 'WhatsApp', 'Blog', 'Status'].map(l => (
                <a key={l} href="#"
                   className="block text-base text-[#9585B8] hover:text-white hover:translate-x-1 transition-all font-medium opacity-80 hover:opacity-100">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10">
               LEGAL
            </h4>
            <div className="space-y-5">
              {['Privacidad', 'Términos', 'Seguridad'].map(l => (
                <a key={l} href="#"
                   className="block text-base text-[#9585B8] hover:text-white hover:translate-x-1 transition-all font-medium opacity-80 hover:opacity-100">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar focalizada */}
        <div className="flex flex-col md:flex-row items-center justify-between
                        pt-12 border-t border-white/10 gap-8">
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black tracking-widest text-[#9585B8]">MADE IN VZLA 🇻🇪</div>
             <p className="text-sm font-bold text-[#3D2D5C] uppercase tracking-widest">
                © 2025 LUMIS · Todo por Su Gloria
             </p>
          </div>
          <div className="flex items-center gap-10">
             <a href="mailto:hola@lumis.app"
                className="text-sm font-black text-[#9585B8] hover:text-[#E040FB] transition-colors flex items-center gap-2">
               <Mail className="w-4 h-4" />
               hola@lumis.app
             </a>
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5CC] animate-pulse" />
                <span className="text-[10px] font-black text-[#9585B8] uppercase tracking-widest">SISTEMAS OPERATIVOS</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
