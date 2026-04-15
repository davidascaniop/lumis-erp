'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()

  // Determinar destino de redirect antes de cerrar sesión
  const { data: { user } } = await supabase.auth.getUser()
  let redirectPath = '/login'
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
    if (data?.role === 'superadmin') redirectPath = '/login-admin'
  }

  await supabase.auth.signOut()
  redirect(redirectPath)
}
