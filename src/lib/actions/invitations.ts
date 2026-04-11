"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteAdminUser(data: { name: string; email: string; permissions: any }) {
  const supabase = await createClient();
  
  // Verify superadmin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: currUser } = await supabase.from("users").select("role").eq("auth_id", user.id).single();
  if (currUser?.role !== "superadmin") throw new Error("No autorizado");

  const email = data.email.trim().toLowerCase();

  // Verifica si el usuario ya existe en Supabase public.users
  const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single();
  if (existingUser) {
    throw new Error("El usuario ya existe en la plataforma.");
  }

  // Verifica si ya hay una invitación pendiente
  const { data: existingInvite } = await supabase
    .from("user_invitations")
    .select("id, status")
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
     // Si ya existe, podríamos solo actualizar sus permisos y exp_date y re-enviar, 
     // por ahora vamos a actualizarlo
     await supabase
       .from("user_invitations")
       .update({ permissions: data.permissions, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
       .eq("id", existingInvite.id);
  } else {
    // Inserta la invitación
    const { error } = await supabase.from("user_invitations").insert({
      email,
      permissions: data.permissions,
    });
    if (error) throw new Error("Error al crear la invitación: " + error.message);
  }

  // Para reflejarlo en la tabla de inmediato, insertamos temporalmente en `users` 
  // con estado 'pending_invite' SIN auth_id (solo para visualización). Así el Superadmin puede verlo.
  const { error: userError } = await supabase.from("users").insert({
    company_id: null,
    full_name: data.name,
    email: email,
    role: "admin", // Legacy compatibility or just visual
    status: "pending_invite",
    permissions: data.permissions,
    is_active: false
  });

  if (userError && userError.code !== '23505') { // Ignore unique violation if already there
    throw new Error("Error al registrar visualmente el usuario invitado: " + userError.message);
  }

  // TODO: Aquí integraríamos Resend para enviar el correo real usando el Token
  // Por ahora logramos en consola
  const { data: inviteData } = await supabase.from("user_invitations").select("token").eq("email", email).single();
  console.log(`[EMAIL SIMULATION] Invitación enviada a ${email}. Enlace: /setup-password?token=${inviteData?.token}`);

  revalidatePath("/superadmin/usuarios/equipo");
  
  return { success: true, token: inviteData?.token };
}

export async function processSetupPassword(token: string, password: string) {
    const supabase = await createClient();
    
    // 1. Validar el token
    const { data: invite, error: inviteError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
        throw new Error("El token es inválido, no existe o ya ha sido utilizado.");
    }

    if (new Date(invite.expires_at) < new Date()) {
        throw new Error("El enlace de invitación ha expirado.");
    }

    // 2. Crear al usuario real en Supabase Auth usando signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.email,
        password: password
    });

    if (authError || !authData.user) {
        throw new Error("Error creando cuenta de autenticación: " + authError?.message);
    }

    // 3. Actualizar el perfil visual `users` que creamos temporalmente 
    const { error: updateError } = await supabase
      .from("users")
      .update({
          auth_id: authData.user.id,
          status: "active",
          is_active: true,
          // Mantener los permisos originales
      })
      .eq("email", invite.email);

    if (updateError) {
        throw new Error("Error actualizando perfil visual: " + updateError.message);
    }

    // 4. Marcar invitación como aceptada
    await supabase
      .from("user_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return { success: true };
}

export async function updateUserPermissions(userId: string, permissions: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: currUser } = await supabase.from("users").select("role").eq("auth_id", user.id).single();
  if (currUser?.role !== "superadmin") throw new Error("No autorizado");

  const { error } = await supabase
    .from("users")
    .update({ permissions })
    .eq("id", userId);

  if (error) throw new Error("Error actualizando permisos: " + error.message);
  revalidatePath("/superadmin/usuarios/equipo");
  
  return { success: true };
}
