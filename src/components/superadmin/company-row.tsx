"use client";
import { useRouter } from "next/navigation";
import { Building2, MoreVertical } from "lucide-react";
import { useState } from "react";
import {
  suspendCompany,
  reactivateCompany,
  changePlan,
} from "@/lib/actions/superadmin";
import { toast } from "sonner";

const PLAN_BADGE: Record<string, string> = {
  emprendedor:
    "bg-[rgba(79,195,247,0.10)] text-[#4FC3F7] border-[rgba(79,195,247,0.20)]",
  crecimiento:
    "bg-[rgba(224,64,251,0.10)] text-[#E040FB] border-[rgba(224,64,251,0.20)]",
  corporativo:
    "bg-[rgba(124,77,255,0.10)] text-[#7C4DFF] border-[rgba(124,77,255,0.20)]",
  enterprise:
    "bg-[rgba(255,184,0,0.10)]  text-[#FFB800] border-[rgba(255,184,0,0.20)]",
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  active: { label: "Activa", dot: "#00E5CC" },
  trial: { label: "Trial", dot: "#FFB800" },
  overdue: { label: "Morosa", dot: "#FF2D55" },
  suspended: { label: "Suspendida", dot: "#9585B8" },
};

export function CompanyRow({ company }: { company: any }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  const status = STATUS_CONFIG[company.plan_status] ?? {
    label: company.plan_status,
    dot: "#9585B8",
  };
  const userCount = company.users?.[0]?.count ?? 0;

  return (
    <div
      className="relative grid grid-cols-[2fr_1fr_1fr_1fr_100px_120px] gap-4 px-6 py-4
                    items-center border-b border-white/[0.03]
                    hover:bg-[#1F1535] transition-colors group cursor-pointer"
      onClick={() => router.push(`/superadmin/empresas/${company.id}`)}
    >
      {/* Empresa */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E040FB]/20 to-[#7C4DFF]/20
                        flex items-center justify-center text-xs font-bold text-[#E040FB] flex-shrink-0"
        >
          {company.name[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-white truncate max-w-[180px]">
            {company.name}
          </p>
          <p className="text-[11px] text-[#9585B8] capitalize">
            {company.business_type ?? "distribuidora"}
          </p>
        </div>
      </div>

      {/* Plan */}
      <span
        className={`inline-flex items-center px-2.5 py-[3px] rounded-full
                        text-[11px] font-semibold border capitalize w-fit
                        ${PLAN_BADGE[company.plan] ?? "bg-white/5 text-[#9585B8] border-white/10"}`}
      >
        {company.plan}
      </span>

      {/* Estado */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: status.dot }}
        />
        <span className="text-xs text-[#9585B8]">{status.label}</span>
      </div>

      {/* Usuarios */}
      <span className="font-mono text-sm text-[#9585B8]">{userCount}</span>

      {/* Fecha */}
      <span className="text-xs text-[#9585B8]">
        {new Date(company.created_at).toLocaleDateString("es-VE", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </span>

      {/* Acciones */}
      <div
        className="flex items-center justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenu(!menu)}
          className="p-1.5 rounded-lg hover:bg-white/8 text-[#9585B8] hover:text-white transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menu && (
          <div
            className="absolute right-4 top-full mt-1 z-20 w-44
                          bg-[#1C1228] border border-white/8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                          overflow-hidden"
          >
            {[
              {
                label: "Ver ficha",
                action: () => router.push(`/superadmin/empresas/${company.id}`),
              },
              {
                label: "Cambiar plan",
                action: async () => {
                  setMenu(false);
                },
              },
              {
                label:
                  company.plan_status === "suspended"
                    ? "Reactivar"
                    : "Suspender",
                action: async () => {
                  if (company.plan_status === "suspended") {
                    await reactivateCompany(company.id);
                    toast.success("Empresa reactivada");
                  } else {
                    await suspendCompany(
                      company.id,
                      "Suspensión manual desde Super Admin",
                    );
                    toast.success("Empresa suspendida");
                  }
                  setMenu(false);
                  router.refresh();
                },
                danger: company.plan_status !== "suspended",
              },
            ].map(({ label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium
                                  hover:bg-white/5 transition-colors ${
                                    danger
                                      ? "text-[#FF2D55]"
                                      : "text-[#9585B8] hover:text-white"
                                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
