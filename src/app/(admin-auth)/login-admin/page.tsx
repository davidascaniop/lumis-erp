'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SuperAdminLogin() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Sesión administrativa iniciada')
      router.push('/superadmin')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050208] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E040FB]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7C4DFF]/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(224,64,251,0.3)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">LUMIS <span className="text-[#E040FB]">Super Login</span></h1>
          <p className="text-[#9585B8] mt-2">Acceso exclusivo para personal autorizado</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E040FB]/40 to-transparent" />
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#3D2D5C] uppercase tracking-widest ml-1">Correo Master</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D2D5C]" />
                <input 
                  required
                  name="email"
                  type="email" 
                  placeholder="admin@lumis.com"
                  className="w-full bg-white/2 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#E040FB]/30 focus:bg-white/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#3D2D5C] uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D2D5C]" />
                <input 
                  required
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-white/2 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#E040FB]/30 focus:bg-white/5 transition-all"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:from-[#E040FB]/90 hover:to-[#7C4DFF]/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_rgba(224,64,251,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Entrar al Panel Maestro
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#3D2D5C] text-sm italic">
          Entorno de alta seguridad — Registro de IP activado
        </p>
      </motion.div>
    </div>
  )
}
