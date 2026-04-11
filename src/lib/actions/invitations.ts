"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendInvitationEmail } from "@/lib/mail";

export async function inviteAdminUser(data: { name: string; email: string; permissions: any }) {
  try {
    const supabase = await createClient();
    
    // Verify superadmin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { data: currUser } = await supabase.from("users").select("role").eq("auth_id", user.id).single();
    if (currUser?.role !== "superadmin") return { success: false, error: "No autorizado para realizar esta acción" };

    const email = data.email.trim().toLowerCase();

    // Verifica si el usuario ya existe en Supabase public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, status")
      .eq("email", email)
      .single();

    if (existingUser && existingUser.status !== "pending_invite") {
      return { success: false, error: "Este correo ya está registrado y activo en el sistema." };
    }

    // Verifica si ya hay una invitación pendiente
    const { data: existingInvite } = await supabase
      .from("user_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    let inviteToken = "";

    if (existingInvite) {
       // Si ya existe, actualizamos permisos y fecha
       const { data: updatedInvite, error: updateInviteError } = await supabase
         .from("user_invitations")
         .update({ 
           permissions: data.permissions, 
           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
         })
         .eq("id", existingInvite.id)
         .select("token")
         .single();
       
       if (updateInviteError) return { success: false, error: "Error actualizando invitación previa: " + updateInviteError.message };
       inviteToken = updatedInvite.token;
    } else {
      // Inserta la nueva invitación
      const { data: newInvite, error: inviteError } = await supabase
        .from("user_invitations")
        .insert({
          email,
          permissions: data.permissions,
        })
        .select("token")
        .single();
      
      if (inviteError) return { success: false, error: "Error al crear la invitación en DB: " + inviteError.message };
      inviteToken = newInvite.token;
    }

    // Registro visual en `users` (Upsert para permitir re-invitación)
    const { error: userError } = await supabase.from("users").upsert({
      full_name: data.name,
      email: email,
      role: "admin",
      status: "pending_invite",
      permissions: data.permissions,
      is_active: false,
      company_id: null
    }, { onConflict: 'email' });

    if (userError) { 
      return { success: false, error: "Error al registrar perfil: " + userError.message };
    }

    // ENVÍO DE EMAIL REAL vía Resend
    const mailRes = await sendInvitationEmail(email, data.name, inviteToken);
    
    if (!mailRes.success) {
      return { 
        success: false, 
        error: "Invitación registrada en base de datos, pero falló el envío del correo: " + mailRes.error,
        token: inviteToken 
      };
    }

    revalidatePath("/superadmin/usuarios/equipo");
    return { success: true, token: inviteToken };

  } catch (error: any) {
    console.error("Critical error in inviteAdminUser:", error);
    return { success: false, error: "Error crítico del servidor: " + error.message };
  }
}

export async function processSetupPassword(token: string, password: string, fullName?: string) {
    try {
      const supabase = await createClient();
      
      const { data: invite, error: inviteError } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (inviteError || !invite) {
          return { success: false, error: "Este enlace ya no es válido, contacta al administrador principal." };
      }

      if (new Date(invite.expires_at) < new Date()) {
          return { success: false, error: "Este enlace ya no es válido, contacta al administrador principal." };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
          email: invite.email,
          password: password
      });

      if (authError || !authData.user) {
          return { success: false, error: "Error en autenticación: " + authError?.message };
      }

      // Build update payload with optional fullName
      const updatePayload: Record<string, unknown> = {
        auth_id: authData.user.id,
        status: "active",
        is_active: true,
      };
      if (fullName) {
        updatePayload.full_name = fullName;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("email", invite.email);

      if (updateError) return { success: false, error: "Error al activar el perfil: " + updateError.message };

      await supabase
        .from("user_invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      return { success: true, email: invite.email };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

export async function validateInvitationToken(token: string) {
  try {
    const supabase = await createClient();

    const { data: invite, error } = await supabase
      .from("user_invitations")
      .select("email, permissions, status, expires_at")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return { valid: false, error: "Este enlace ya no es válido, contacta al administrador principal." };
    }

    if (invite.status !== "pending") {
      return { valid: false, error: "Este enlace ya no es válido, contacta al administrador principal." };
    }

    if (new Date(invite.expires_at) < new Date()) {
      return { valid: false, error: "Este enlace ya no es válido, contacta al administrador principal." };
    }

    // Fetch the pre-created user profile to get the name
    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name")
      .eq("email", invite.email)
      .single();

    return {
      valid: true,
      email: invite.email,
      fullName: userProfile?.full_name || "",
    };
  } catch (error: any) {
    return { valid: false, error: "Error al validar el enlace: " + error.message };
  }
}

export async function updateUserPermissions(userId: string, permissions: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { data: currUser } = await supabase.from("users").select("role").eq("auth_id", user.id).single();
    if (currUser?.role !== "superadmin") return { success: false, error: "No autorizado" };

    const { error } = await supabase
      .from("users")
      .update({ permissions })
      .eq("id", userId);

    if (error) return { success: false, error: "Error en base de datos: " + error.message };
    
    revalidatePath("/superadmin/usuarios/equipo");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
