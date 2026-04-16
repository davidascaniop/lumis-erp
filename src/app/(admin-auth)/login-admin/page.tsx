'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Mail, Lock, ArrowRight, Loader2, User, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { createSuperadminClient } from '@/lib/supabase/superadmin-client'
import { validateInvitationToken, processSetupPassword } from '@/lib/actions/invitations'
import { toast } from 'sonner'

// ---------- Setup Form (invitation token flow) ----------
function SetupForm({ token }: { token: string }) {
  const router = useRouter()

  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function validate() {
      try {
        const res = await validateInvitationToken(token)
        if (res.valid) {
          setTokenValid(true)
          setEmail(res.email || '')
          setFullName(res.fullName || '')
        } else {
          setTokenError(res.error || 'Este enlace ya no es válido, contacta al administrador principal.')
        }
      } catch {
        setTokenError('Error al validar el enlace.')
      } finally {
        setValidating(false)
      }
    }
    validate()
  }, [token])

  async function handleSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await processSetupPassword(token, password, fullName)
      if (res.success) {
        // Auto-login from client side to set browser cookies
        const supabase = createSuperadminClient()
        await supabase.auth.signInWithPassword({ email, password })

        setSuccess(true)
        toast.success('¡Cuenta activada exitosamente!')
        setTimeout(() => {
          router.push('/superadmin')
          router.refresh()
        }, 1500)
      } else {
        toast.error(res.error || 'Error al activar la cuenta')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while validating token
  if (validating) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto mb-4" />
          <p className="text-text-2 font-medium">Validando enlace de invitación...</p>
        </motion.div>
      </div>
    )
  }

  // Invalid / expired token
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full relative z-10">
          <div className="bg-surface-card p-8 rounded-3xl border border-border shadow-card text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-1 mb-2">Enlace No Válido</h2>
            <p className="text-text-2 text-sm leading-relaxed">{tokenError}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <div className="bg-surface-card p-10 rounded-3xl border border-border shadow-card">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-1 mb-2">¡Cuenta Activada!</h2>
            <p className="text-text-2 mb-6">Redirigiendo al panel administrativo...</p>
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        </motion.div>
      </div>
    )
  }

  // Setup form
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand/20 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-1 tracking-tight">Configurar tu <span className="text-brand">Acceso</span></h1>
          <p className="text-text-2 mt-2 font-medium">Completa tu registro para activar tu cuenta administrativa</p>
        </div>

        <div className="bg-surface-card p-8 rounded-3xl border border-border shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient opacity-10" />

          <form onSubmit={handleSetup} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full bg-surface-base border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input
                  readOnly
                  type="email"
                  value={email}
                  className="w-full bg-surface-base/50 border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-text-2 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Crear Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full bg-surface-base border border-border rounded-xl py-3 pl-11 pr-11 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input
                  required
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  minLength={6}
                  className="w-full bg-surface-base border border-border rounded-xl py-3 pl-11 pr-11 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password match indicator */}
            {confirmPassword && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 pl-1">
                {password === confirmPassword ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Las contraseñas coinciden</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Las contraseñas no coinciden</span>
                  </>
                )}
              </motion.div>
            )}

            <button
              disabled={loading || password !== confirmPassword || password.length < 6}
              className="w-full bg-brand-gradient hover:opacity-90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-brand/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Activar mi Cuenta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-text-3 text-sm font-medium italic">
          Entorno de alta seguridad — Registro de IP activado
        </p>
      </motion.div>
    </div>
  )
}

// ---------- Login Form (normal admin login) ----------
function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSuperadminClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { error } = await supabase.auth.signInWithPassword({
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
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand/20 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-1 tracking-tight">LUMIS <span className="text-brand">Super Login</span></h1>
          <p className="text-text-2 mt-2 font-medium">Acceso exclusivo para personal autorizado</p>
        </div>

        <div className="bg-surface-card p-8 rounded-3xl border border-border shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient opacity-10" />
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Correo Master</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input 
                  required
                  name="email"
                  type="email" 
                  placeholder="admin@lumis.com"
                  className="w-full bg-surface-base border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input 
                  required
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-surface-base border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-brand-gradient hover:opacity-90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-brand/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
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

        <p className="text-center mt-6 text-text-3 text-sm font-medium italic">
          Entorno de alta seguridad — Registro de IP activado
        </p>
      </motion.div>
    </div>
  )
}

// ---------- Router Component (reads ?token) ----------
function LoginAdminRouter() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return (
    <AnimatePresence mode="wait">
      {token ? <SetupForm key="setup" token={token} /> : <LoginForm key="login" />}
    </AnimatePresence>
  )
}

// ---------- Main Page ----------
export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <LoginAdminRouter />
    </Suspense>
  )
}
