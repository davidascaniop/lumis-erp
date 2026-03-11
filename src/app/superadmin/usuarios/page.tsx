import { createClient } from '@/lib/supabase/server'
import { MoreVertical, UserPlus, Shield, User } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Usuarios del Sistema</h1>
          <p className="text-sm text-[#9585B8] mt-0.5">
            Gestiona permisos y roles de todos los usuarios registrados
          </p>
        </div>
      </div>

      <div className="bg-[#18102A] border border-white/6 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-6 py-3 border-b border-white/5 bg-white/2">
          {['Usuario', 'Rol', 'Registro', 'Acciones'].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest">
              {h}
            </span>
          ))}
        </div>

        <div className="divide-y divide-white/[0.03]">
          {users?.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  )
}

function UserRow({ user }: { user: any }) {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#E040FB] font-bold">
          {user.full_name?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.full_name || 'Sin nombre'}</p>
          <p className="text-[11px] text-[#9585B8] truncate">{user.email}</p>
        </div>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
          user.role === 'superadmin' 
            ? 'bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/20' 
            : 'bg-white/5 text-[#9585B8] border-white/10'
        }`}>
          {user.role === 'superadmin' && <Shield className="w-2.5 h-2.5" />}
          {user.role || 'user'}
        </span>
      </div>

      <span className="text-xs text-[#3D2D5C]">
        {new Date(user.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
      </span>

      <div className="flex justify-end">
        <form action={async () => {
          'use server'
          const supabase = await createClient()
          const newRole = user.role === 'superadmin' ? 'user' : 'superadmin'
          await supabase.from('users').update({ role: newRole }).eq('id', user.id)
          revalidatePath('/superadmin/usuarios')
        }}>
          <button className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
            user.role === 'superadmin'
              ? 'bg-white/5 text-[#9585B8] border-white/10 hover:bg-white/10'
              : 'bg-[#E040FB]/10 text-[#E040FB] border-[#E040FB]/20 hover:bg-[#E040FB]/20'
          }`}>
            {user.role === 'superadmin' ? 'Quitar Admin' : 'Hacer Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
