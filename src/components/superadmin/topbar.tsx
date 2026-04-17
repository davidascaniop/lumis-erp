import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOutSuperadmin } from '@/lib/actions/superadmin-auth'

export function SuperAdminTopbar({ admin }: { admin: any }) {
  return (
    <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-surface-base/80 backdrop-blur-xl shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
        <span className="text-xs font-semibold text-text-3 uppercase tracking-widest">Panel Privado</span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/mi-cuenta"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover/30 transition-colors group"
          title="Editar mi cuenta"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#E040FB] flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden shadow-sm">
            {admin?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'SA'}
          </div>
          <div className="flex flex-col -space-y-0.5">
            <span className="text-[11px] font-bold text-text-1 leading-tight uppercase group-hover:text-brand transition-colors">{admin?.full_name}</span>
            <span className="text-[9px] text-text-3 font-medium tracking-tight">Super Admin</span>
          </div>
        </Link>

        <div className="h-4 w-[1px] bg-border mx-1" />

        <form action={signOutSuperadmin}>
          <button className="p-2 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 transition-all flex items-center gap-2 group" title="Cerrar Sesión">
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </header>
  )
}
