import { createSuperadminServerClient } from "@/lib/supabase/superadmin-server";
import { MiCuentaForm } from "@/components/superadmin/mi-cuenta-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, Mail, Calendar } from "lucide-react";

export default async function MiCuentaPage() {
  const supabase = await createSuperadminServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, role, created_at")
    .eq("auth_id", authUser?.id || "")
    .single();

  return (
    <div className="space-y-6 page-enter pb-10 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-1">Mi Cuenta</h1>
        <p className="text-sm text-text-3 mt-0.5 font-medium">
          Actualiza tu información personal y contraseña de acceso
        </p>
      </div>

      {/* Account info header card */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF2D55] to-[#E040FB] flex items-center justify-center text-lg font-bold text-white uppercase shadow-md">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'SA'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-1">{profile?.full_name || 'Super Admin'}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-3 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {profile?.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand" />
                <span className="uppercase tracking-wider text-brand font-bold">{profile?.role}</span>
              </span>
              {profile?.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Miembro desde {format(new Date(profile.created_at), "MMM yyyy", { locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable form */}
      <MiCuentaForm
        initialFullName={profile?.full_name || ""}
        email={profile?.email || ""}
      />
    </div>
  );
}
