'use server'
import { createSuperadminServerClient } from '@/lib/supabase/superadmin-server'
import { redirect } from 'next/navigation'

/**
 * Cierra la sesión del superadmin.
 *
 * Importante: el superadmin usa una cookie separada ('lumis-superadmin-session')
 * distinta de la del dashboard de clientes. Si usáramos el signOut genérico
 * (que opera sobre la cookie por defecto), la sesión del superadmin quedaría
 * intacta y el botón no haría nada real. Esta acción fuerza el signOut sobre
 * el cliente correcto y redirige al login administrativo.
 */
export async function signOutSuperadmin() {
  const supabase = await createSuperadminServerClient()
  await supabase.auth.signOut()
  redirect('/login-admin')
}

/**
 * Actualiza los datos del perfil del superadmin actual.
 * - full_name se guarda en public.users
 * - password se actualiza en auth (si se proporciona)
 */
export async function updateSuperadminProfile(formData: FormData) {
  const supabase = await createSuperadminServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }

  const fullName = String(formData.get('fullName') || '').trim()
  const newPassword = String(formData.get('newPassword') || '')

  if (!fullName) return { ok: false, error: 'El nombre no puede estar vacío.' }

  // Nombre en la tabla users
  const { error: profileError } = await supabase
    .from('users')
    .update({ full_name: fullName } as any)
    .eq('auth_id', user.id)

  if (profileError) return { ok: false, error: profileError.message }

  // Password en auth (solo si el user lo ingresó)
  if (newPassword) {
    if (newPassword.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
    }
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
    if (pwError) return { ok: false, error: pwError.message }
  }

  return { ok: true }
}
