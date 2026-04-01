"use client";

import { useState } from "react";
import { upsertFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Loader2, Edit2, X } from "lucide-react";

export function PaymentMethodsSection({ configJSON }: { configJSON?: string }) {
  const [loading, setLoading] = useState(false);

  // Default config if not in DB
  const [methods, setMethods] = useState(() => {
    if (configJSON) {
      try {
        return JSON.parse(configJSON);
      } catch (e) {}
    }
    return [
      { id: "pago_movil", name: "Pago Móvil", active: true, data: { banco: "Banesco (0134)", telefono: "04149406419", cedula: "V-24647547" } },
      { id: "zinli", name: "Zinli", active: true, data: { email: "davidascaniop@gmail.com" } },
      { id: "binance", name: "Binance", active: true, data: { email: "davidascaniop@gmail.com", titular: "David Ascanio" } },
      { id: "zelle", name: "Zelle", active: false },
      { id: "stripe", name: "Stripe", active: false },
      { id: "paypal", name: "PayPal", active: false }
    ];
  });

  const [editingMethod, setEditingMethod] = useState<any>(null);

  const saveConfig = async (newMethods: any[]) => {
    setLoading(true);
    try {
      await upsertFeatureFlag("payment_methods", JSON.stringify(newMethods), "Confiuración global de métodos de pago");
      setMethods(newMethods);
      toast.success("Métodos de pago actualizados");
      setEditingMethod(null);
    } catch {
      toast.error("Error al guardar métodos de pago");
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (id: string) => {
    const updated = methods.map((m: any) => m.id === id ? { ...m, active: !m.active } : m);
    saveConfig(updated);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const dataObj: any = {};
    formData.forEach((value, key) => { dataObj[key] = value; });

    const updated = methods.map((m: any) => m.id === editingMethod.id ? { ...m, data: dataObj } : m);
    saveConfig(updated);
  };

  const requiresData = ["pago_movil", "zinli", "binance"];

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-xs text-gray-500 mt-0.5">Administra los métodos de pago globales</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {methods.map((method: any) => (
          <div key={method.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleMethod(method.id)}
                disabled={loading}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                            ${method.active ? "bg-[#E040FB]" : "bg-gray-200"}`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm
                                  ${method.active ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-900">{method.name}</p>
                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                  <span className={method.active ? "text-green-600" : "text-gray-400"}>
                    {method.active ? "Activo" : "Próximamente"}
                  </span>
                </div>
              </div>
            </div>

            {requiresData.includes(method.id) && method.active && (
              <button
                onClick={() => setEditingMethod(method)}
                className="p-2 text-gray-500 hover:text-[#E040FB] hover:bg-[#E040FB]/10 rounded-lg transition-colors"
                title="Editar datos"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {editingMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingMethod(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-gray-900 mb-4">Editar Datos: {editingMethod.name}</h3>
            
            <form onSubmit={saveEdit} className="space-y-4">
              {editingMethod.id === "pago_movil" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Banco</label>
                    <input name="banco" defaultValue={editingMethod.data?.banco} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Teléfono</label>
                    <input name="telefono" defaultValue={editingMethod.data?.telefono} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Cédula</label>
                    <input name="cedula" defaultValue={editingMethod.data?.cedula} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                  </div>
                </>
              )}

              {editingMethod.id === "zinli" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Email</label>
                  <input type="email" name="email" defaultValue={editingMethod.data?.email} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                </div>
              )}

              {editingMethod.id === "binance" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Email / Pay ID</label>
                    <input name="email" defaultValue={editingMethod.data?.email} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre del titular</label>
                    <input name="titular" defaultValue={editingMethod.data?.titular} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB]" required />
                  </div>
                </>
              )}

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
