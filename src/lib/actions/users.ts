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
        // Redirigir a la página donde el usuario creará su contraseña
        redirectTo: 'https://uselumisapp.com/auth/confirm'
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
        status: "pendiente",
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
             permissions: permissions,
             status: "pendiente"
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

export async function deleteCompanyUser(
  targetAuthId: string,
  targetUserId: string,
  companyId: string,
  requesterAuthId: string
) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Missing Supabase admin configuration");
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Verificar que el solicitante sea Administrador de esta empresa (o superadmin logueado)
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from("users")
      .select("role, company_id")
      .eq("auth_id", requesterAuthId)
      .single();

    const isSuperAdmin = requester?.role === "superadmin";
    const isAdmin = requester?.role === "admin";
    const isGerente = requester?.role === "gerente";

    if (requesterError || !requester) {
      console.error("[deleteCompanyUser] Requester not found or error:", requesterError);
      return { success: false, error: "No tienes permisos para eliminar usuarios (perfil autorizador no encontrado)." };
    }

    if (!isSuperAdmin && (requester.company_id !== companyId || (!isAdmin && !isGerente))) {
      console.warn("[deleteCompanyUser] Permission denied for:", { 
          role: requester.role, 
          reqCo: requester.company_id, 
          targetCo: companyId 
      });
      return { success: false, error: "No tienes permisos para eliminar usuarios en este espacio." };
    }

    // 2. Primero eliminar el registro de la tabla de usuarios local usando el ID de tabla
    if (targetUserId) {
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", targetUserId);

      if (dbError) {
        console.error("[deleteCompanyUser] DB delete error:", dbError);
      }
    }

    // 3. Luego llamar a deleteUser para borrarlo completamente de Supabase Auth
    if (targetAuthId) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetAuthId);
      if (authError) {
        console.error("[deleteCompanyUser] Auth delete error:", authError);
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteCompanyUser] Unexpected error:", error);
    return { success: false, error: error.message || "Error interno del servidor" };
  }
}

export async function activateCompanyUser(email: string, authId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase admin configuration");
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Buscar si existe un perfil pendiente y obtener la empresa correcta
    const { data: pendingProfile, error: searchError } = await supabaseAdmin
      .from("users")
      .select("id, company_id, status")
      .eq("email", email)
      .eq("status", "pendiente")
      .single();

    if (searchError || !pendingProfile) {
      return { success: false, error: "Esta invitación no es válida o ya fue usada" };
    }

    // Actualizamos el status a activo y aseguramos el company_id original del invite
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        status: "activo",
        company_id: pendingProfile.company_id, // Forzamos el ID original
        auth_id: authId // Confirmamos que el auth_id coincide con el de la sesión actual
      })
      .eq("id", pendingProfile.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true };

  } catch (error: any) {
    console.error("[activateCompanyUser] Unexpected error:", error);
    return { success: false, error: error.message || "Error al activar la cuenta" };
  }
}

