"use client";

import { useState } from "react";
import { upsertFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Loader2, Edit2, X } from "lucide-react";

export function PlansSection({ configJSON }: { configJSON?: string }) {
  const [loading, setLoading] = useState(false);

  // Default plans if not in DB
  const [plans, setPlans] = useState(() => {
    if (configJSON) {
      try {
        return JSON.parse(configJSON);
      } catch (e) {}
    }
    return [
      { id: "basic", name: "Lumis Starter", price: "$19.99", desc: "Se acabó el desorden de facturas y el Excel manual" },
      { id: "pro", name: "Lumis Pro Business", price: "$79.99", desc: "Multiplica tus ventas con WhatsApp y CRM integrado" },
      { id: "enterprise", name: "Lumis Enterprise", price: "$119.99", desc: "Control total de todas tus sedes y distribuidores" }
    ];
  });

  const [editingPlan, setEditingPlan] = useState<any>(null);

  const saveConfig = async (newPlans: any[]) => {
    setLoading(true);
    try {
      await upsertFeatureFlag("plans_config", JSON.stringify(newPlans), "Configuración de planes y precios");
      setPlans(newPlans);
      toast.success("Planes actualizados. Los cambios se reflejarán en el onboarding.");
      setEditingPlan(null);
    } catch {
      toast.error("Error al guardar planes");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const updated = plans.map((p: any) => 
      p.id === editingPlan.id 
        ? { 
            ...p, 
            name: formData.get("name"), 
            price: `$${formData.get("price")}`, // ensuring format
            desc: formData.get("desc") 
          } 
        : p
    );
    saveConfig(updated);
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold text-gray-900">Planes y Precios</h2>
          <p className="text-xs text-gray-500 mt-0.5">Controla la información y costo de los planes</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Precio Actual</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((plan: any) => (
              <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-bold flex flex-col gap-0.5">
                  {plan.name}
                  <span className="text-[10px] text-gray-500 font-normal">{plan.desc}</span>
                </td>
                <td className="px-6 py-4 font-mono text-gray-900 font-bold">{plan.price}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="p-2 text-gray-500 hover:text-[#E040FB] hover:bg-[#E040FB]/10 rounded-lg transition-colors inline-flex"
                    title="Editar Plan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingPlan(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-gray-900 mb-4">Editar Plan: {editingPlan.id}</h3>
            
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre del plan</label>
                <input name="name" defaultValue={editingPlan.name} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Precio (USD, ej. 19.99)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-bold">$</span>
                  <input name="price" type="number" step="0.01" defaultValue={editingPlan.price.replace('$', '')} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB] font-mono" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción corta</label>
                <textarea name="desc" defaultValue={editingPlan.desc} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB] resize-none" required />
              </div>

              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
