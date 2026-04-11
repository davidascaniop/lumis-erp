"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { processSetupPassword } from "@/lib/actions/invitations";
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token de acceso inválido o faltante.");
      return;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processSetupPassword(token, password);
      if (res.success) {
        setIsSuccess(true);
        toast.success("Cuenta configurada correctamente.");
      }
    } catch (error: any) {
      toast.error("Error al configurar la cuenta", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-brand/5 p-8 border border-border/50 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mb-6">
             <CheckCircle2 className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-1 mb-3">¡Bienvenido al Equipo!</h2>
          <p className="text-sm font-medium text-text-2 mb-8 mx-auto leading-relaxed">
            Tu cuenta ha sido activada correctamente con los permisos asignados por el administrador.
          </p>
          <Link href="/login" className="w-full h-12 flex items-center justify-center bg-brand text-white font-bold rounded-xl hover:opacity-90 transition-opacity decoration-none">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-brand/5 p-8 border border-border/50 relative overflow-hidden">
        
        {/* Decoración Superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand to-[#7C4DFF]" />
        
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center shadow-inner mb-4">
            <Shield className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-1 tracking-tight">Establecer Contraseña</h1>
          <p className="text-sm font-medium text-text-2 mt-2 leading-relaxed">
            Crea una clave segura para proteger tu cuenta y acceder al panel de administración.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-1.5 relative">
              <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider pl-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 bg-[#F8F9FE] border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 text-text-1 transition-all placeholder:text-text-3 font-medium"
                  placeholder="Mínimo 8 caracteres"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-3 hover:text-text-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
           </div>

           <div className="space-y-1.5 relative">
              <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider pl-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 bg-[#F8F9FE] border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 text-text-1 transition-all placeholder:text-text-3 font-medium"
                  placeholder="Repite la contraseña"
                />
              </div>
           </div>

           <button 
              type="submit" 
              disabled={isProcessing || !token}
              className="w-full h-12 mt-2 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Activar y Continuar</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </>
              )}
           </button>
        </form>

        {!token && (
          <div className="mt-6 p-4 bg-status-danger/10 border border-status-danger/20 rounded-xl text-center">
            <p className="text-xs font-bold text-status-danger">El enlace es inválido o no incluye un token de seguridad válido.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  );
}
