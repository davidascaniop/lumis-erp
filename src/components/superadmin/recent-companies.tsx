import Link from "next/link";

export function RecentCompanies({ companies }: { companies: any[] }) {
  if (!companies || companies.length === 0) {
    return (
      <p className="text-sm text-[#9585B8] py-4 text-center">
        No hay empresas recientes.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {companies.map((c) => (
        <Link
          key={c.id}
          href={`/superadmin/empresas/${c.id}`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">{c.name}</p>
              <p className="text-xs text-[#9585B8] truncate max-w-[150px]">
                {c.owner_email ?? "Sin correo"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-md text-[9px] uppercase font-bold bg-white/5 text-[#9585B8] mb-1">
                {c.plan}
              </span>
              <p className="text-[9px] text-[#3D2D5C]">
                {new Date(c.created_at).toLocaleDateString("es-VE", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
