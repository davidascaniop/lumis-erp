import { createClient } from "@/lib/supabase/server";
import { CompanyRow } from "@/components/superadmin/company-row";
import { Building2, Plus } from "lucide-react";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; status?: string };
}) {
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select(
      `
      id, name, plan, plan_status, created_at,
      owner_email, owner_phone, business_type,
      trial_ends_at, suspended_at, suspend_reason,
      users(count)
    `,
    )
    .order("created_at", { ascending: false });

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.plan) query = query.eq("plan", searchParams.plan);
  if (searchParams.status) query = query.eq("plan_status", searchParams.status);

  const { data: companies } = await query;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Empresas
          </h1>
          <p className="text-sm text-[#9585B8] mt-0.5">
            {companies?.length ?? 0} empresas registradas en LUMIS
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Buscador */}
        <form
          className="flex items-center gap-2.5 px-4 py-2.5
                         bg-[#18102A] border border-white/6 rounded-xl
                         focus-within:border-[rgba(224,64,251,0.35)] transition-all w-72"
        >
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nombre..."
            className="bg-transparent text-sm text-white placeholder-[#3D2D5C] focus:outline-none flex-1"
          />
        </form>

        {/* Filtro plan */}
        {["emprendedor", "crecimiento", "corporativo"].map((plan) => (
          <a
            key={plan}
            href={`?plan=${plan}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              searchParams.plan === plan
                ? "bg-[rgba(224,64,251,0.15)] text-[#E040FB] border border-[rgba(224,64,251,0.30)]"
                : "bg-white/4 text-[#9585B8] border border-white/6 hover:text-white"
            }`}
          >
            {plan}
          </a>
        ))}

        {/* Filtro estado */}
        {[
          { key: "active", label: "Activas", color: "#00E5CC" },
          { key: "trial", label: "Trial", color: "#FFB800" },
          { key: "overdue", label: "Morosas", color: "#FF2D55" },
          { key: "suspended", label: "Suspendidas", color: "#9585B8" },
        ].map((s) => (
          <a
            key={s.key}
            href={`?status=${s.key}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              searchParams.status === s.key
                ? "bg-white/8 text-white border border-white/15"
                : "bg-white/4 text-[#9585B8] border border-white/6 hover:text-white"
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </a>
        ))}

        {/* Limpiar filtros */}
        {(searchParams.q || searchParams.plan || searchParams.status) && (
          <a
            href="/superadmin/empresas"
            className="text-xs text-[#9585B8] hover:text-white transition-colors"
          >
            × Limpiar
          </a>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-[#18102A] border border-white/6 rounded-2xl overflow-hidden">
        {/* Header de tabla */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px_120px] gap-4 px-6 py-3 border-b border-white/5">
          {[
            "Empresa",
            "Plan",
            "Estado",
            "Usuarios",
            "Registro",
            "Acciones",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-[0.10em]"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Filas */}
        {(companies ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-10 h-10 text-[#3D2D5C] mb-4" />
            <p className="text-sm text-[#9585B8]">No se encontraron empresas</p>
          </div>
        ) : (
          (companies ?? []).map((company) => (
            <CompanyRow key={company.id} company={company} />
          ))
        )}
      </div>
    </div>
  );
}
