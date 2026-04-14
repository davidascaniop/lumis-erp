"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function inviteCompanyUser(
  email: string,
  fullName: string,
  role: string,
  companyId: string,
  invitedByAuthId: string,
  permissions: string[] = []
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: false, error: "NEXT_PUBLIC_SUPABASE_URL no está configurada en las variables de entorno" };
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno" };
    }

    // 1. Usar el cliente admin para tener permisos de enviar invitaciones (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Enviar invitación por email a través de Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: {
          full_name: fullName.trim(),
          role: role,
          company_id: companyId,
          permissions: permissions,
        },
        // Opcional: Redirigir a una página específica tras aceptar
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    if (authError || !authData.user) {
      console.error("[inviteCompanyUser] Auth error:", authError);
      return { success: false, error: authError?.message || "Error al enviar la invitación de Supabase" };
    }

    // 3. Crear el registro en la tabla pública "users" inmediatamente
    // Así el usuario ya aparece en la lista de "Usuarios y Roles"
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        role: role,
        company_id: companyId,
        permissions: permissions,
      });

    // Si el usuario ya estaba invitado o existe, esto podría dar error por llave duplicada (auth_id)
    // En ese caso, podríamos simplemente actualizar su rol/company_id
    if (insertError) {
      // Ignoramos si es un error de unicidad (el usuario ya estaba registrado en esta app)
      // pero actualizamos su rol y compañía
      if (insertError.code === '23505') {
         await supabaseAdmin.from("users").update({
             role: role,
             company_id: companyId,
             full_name: fullName.trim(),
             permissions: permissions
         }).eq("auth_id", authData.user.id);
      } else {
        console.error("[inviteCompanyUser] Insert error:", insertError);
        return { success: false, error: "Error al registrar el perfil del usuario" };
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[inviteCompanyUser] Unexpected error:", error);
    return { success: false, error: error?.message || "Error del servidor al invitar" };
  }
}
