"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Lock, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { updateSuperadminProfile } from "@/lib/actions/superadmin-auth";

export function MiCuentaForm({
  initialFullName,
  email,
}: {
  initialFullName: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasPwChange = newPassword.length > 0 || confirmPassword.length > 0;
  const pwError =
    hasPwChange && newPassword !== confirmPassword
      ? "Las contraseñas no coinciden"
      : hasPwChange && newPassword.length < 6
      ? "Mínimo 6 caracteres"
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwError) {
      toast.error(pwError);
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      if (hasPwChange) fd.append("newPassword", newPassword);

      const res = await updateSuperadminProfile(fd);
      if (!res.ok) {
        toast.error(res.error || "No se pudo actualizar la cuenta");
      } else {
        toast.success("Cuenta actualizada correctamente");
        setNewPassword("");
        setConfirmPassword("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal info */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
          <User className="w-4 h-4 text-brand" /> Datos Personales
        </h3>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Nombre Completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Ej: David Ascanio"
            className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full h-11 bg-surface-base/50 border border-border rounded-xl px-4 text-sm text-text-2 cursor-not-allowed"
          />
          <p className="text-[10px] text-text-3 italic">
            El correo no se puede modificar por razones de seguridad. Contacta al equipo si necesitas cambiarlo.
          </p>
        </div>
      </div>

      {/* Password change */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand" /> Cambiar Contraseña
          </h3>
          <p className="text-xs text-text-3 mt-1 font-medium">
            Deja los campos en blanco si no quieres cambiar tu contraseña.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={hasPwChange ? 6 : 0}
              className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 pr-11 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Confirmar Nueva Contraseña
          </label>
          <input
            type={showPw ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu nueva contraseña"
            className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
          />
          {pwError && (
            <p className="text-[11px] text-status-danger font-bold">{pwError}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading || !!pwError || fullName.trim().length === 0}
          className="px-6 py-3 bg-brand-gradient text-white font-bold rounded-xl shadow-brand disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
