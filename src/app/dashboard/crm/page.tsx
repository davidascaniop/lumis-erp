"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { NuevaOportunidadModal } from "@/components/crm/NuevaOportunidadModal";
import { ClientePanel } from "@/components/crm/ClientePanel";
import { Plus, Search, Flame } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CRMPage() {
  const { user } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [CheckingPlan, setCheckingPlan] = useState(true);
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todas" | "mias" | "hoy" | "calientes">("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
      if (!user?.company_id) return;
      try {
        const { data: org } = await supabase
          .from("companies")
          .select("plan_type, subscription_status")
          .eq("id", user.company_id)
          .single();

        const hasCRM =
          ["pro", "enterprise", "basic", "starter", "full"].includes(org?.plan_type ?? "") ||
          org?.subscription_status === "active" ||
          org?.subscription_status === "demo";

        if (!hasCRM) {
          router.push("/dashboard/upgrade");
          return;
        }
      } catch {
        // Fail open — don't block access on network error
      }
      setCheckingPlan(false);
      fetchOportunidades();
    }
    init();
  }, [user]);

  const fetchOportunidades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_oportunidades")
      .select(`
        *,
        partners:cliente_id (id, name, phone, whatsapp, email)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error("Error al cargar oportunidades");
    } else {
      setOportunidades(data || []);
    }
    setLoading(false);
  };

  const handleUpdateEtapa = async (id: string, newEtapa: string) => {
    const orig = [...oportunidades];
    setOportunidades(ops => ops.map(o => o.id === id ? { ...o, etapa: newEtapa } : o));
    
    const { error } = await supabase
      .from("crm_oportunidades")
      .update({ etapa: newEtapa })
      .eq("id", id);
      
    if (error) {
      toast.error("No se pudo mover la oportunidad");
      setOportunidades(orig);
    }
  };

  if (CheckingPlan || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  const filteredOps = oportunidades.filter(o => {
    if (search && !o.partners?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "mias" && o.agente_id !== user.id) return false;
    if (filter === "calientes" && (o.score || 0) < 70) return false;
    if (filter === "hoy") {
      const today = new Date().toISOString().split('T')[0];
      const opDate = new Date(o.updated_at).toISOString().split('T')[0];
      if (today !== opDate) return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col pt-6 px-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-1">CRM Oportunidades</h1>
          <p className="text-sm text-text-3">Gestiona tu pipeline de ventas y contactos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-base border border-border rounded-xl text-sm w-full sm:w-64 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-text-1"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-semibold shadow-brand-lg hover:opacity-90 transition-all font-outfit"
          >
            <Plus className="w-4 h-4" />
            Nueva Oportunidad
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {(["todas", "mias", "hoy", "calientes"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-outfit uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === f 
                ? "bg-brand/10 text-brand border-brand/20 border" 
                : "bg-surface-base text-text-3 border border-border hover:text-text-1 hover:bg-surface-hover/10"
            }`}
          >
            {f === "calientes" ? <><Flame className="inline w-3 h-3 mr-1" /> Calientes</> : f}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board Area */}
        <div className={`flex-1 transition-all overflow-x-auto ${selectedOp ? "opacity-30 md:opacity-100" : ""}`}>
          <KanbanBoard 
            oportunidades={filteredOps} 
            onUpdateEtapa={handleUpdateEtapa}
            onSelectOp={setSelectedOp}
          />
        </div>
        
        {/* Right Panel (True Universal Side Sheet) */}
        {selectedOp && (
          <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] animate-in slide-in-from-right-10 bg-surface-base/95 backdrop-blur-2xl z-[100] shadow-2xl border-l border-border/50 overflow-hidden">
            <ClientePanel 
              oportunidad={selectedOp} 
              onClose={() => setSelectedOp(null)}
              onUpdate={() => {
                fetchOportunidades();
                setSelectedOp(null);
              }}
            />
          </div>
        )}
      </div>

      <NuevaOportunidadModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOportunidades}
      />
    </div>
  );
}
