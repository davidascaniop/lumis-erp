"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search, Truck, Warehouse, Package, History, MoreVertical, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { SupplierForm } from "@/components/purchases/supplier-form";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ComprasPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // States for lists
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  // States for modals
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [openWarehouse, setOpenWarehouse] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [pRes, sRes, wRes] = await Promise.all([
        supabase.from("purchases").select("*, suppliers(name), warehouses(name)").eq("company_id", user.company_id).order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").eq("company_id", user.company_id),
        supabase.from("warehouses").select("*").eq("company_id", user.company_id),
      ]);
      setPurchases(pRes.data || []);
      setSuppliers(sRes.data || []);
      setWarehouses(wRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <SupplierForm open={openSupplier} setOpen={setOpenSupplier} supplier={selectedSupplier} onSuccess={fetchData} />
      <WarehouseForm open={openWarehouse} setOpen={setOpenWarehouse} warehouse={selectedWarehouse} onSuccess={fetchData} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary">Gestión de Logística</h1>
          <p className="text-text-3 font-medium">Compras, proveedores y múltiples almacenes.</p>
        </div>
        <Link 
          href="/dashboard/compras/nueva"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Compra
        </Link>
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-surface-card border border-border p-1 rounded-xl">
          <TabsTrigger value="history" className="data-[state=active]:bg-brand rounded-lg px-6 py-2">
            <History className="w-4 h-4 mr-2" /> Historial
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-brand rounded-lg px-6 py-2">
            <Truck className="w-4 h-4 mr-2" /> Proveedores
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="data-[state=active]:bg-brand rounded-lg px-6 py-2">
            <Warehouse className="w-4 h-4 mr-2" /> Almacenes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card className="bg-surface-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-text-3 font-bold uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Ref / Fecha</th>
                    <th className="px-6 py-4">Proveedor / Destino</th>
                    <th className="px-6 py-4">Total USD</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold">{p.purchase_number || "S/N"}</p>
                        <p className="text-[10px] text-text-3">{format(new Date(p.created_at), "dd MMM, yyyy HH:mm", { locale: es })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand">{p.suppliers?.name}</p>
                        <p className="text-[10px] text-text-3 flex items-center gap-1"><Warehouse className="w-2 h-2" /> {p.warehouses?.name}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">${Number(p.total_usd).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-status-ok/20 text-status-ok rounded text-[10px] font-bold uppercase">Recibido</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-text-3 hover:text-white transition-all"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchases.length === 0 && (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto"><Package className="opacity-20 w-8 h-8" /></div>
                   <p className="text-text-3">No hay compras registradas aún.</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <Card key={s.id} className="p-6 bg-surface-card border-border hover:border-brand/40 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center font-bold text-xl uppercase tracking-tighter shadow-inner">
                    {s.name.substring(0, 2)}
                  </div>
                  <button 
                    onClick={() => { setSelectedSupplier(s); setOpenSupplier(true); }}
                    className="p-2 text-text-3 hover:text-brand transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
                <p className="text-sm text-text-3 mb-4 font-mono">{s.rif}</p>
                <div className="pt-4 border-t border-white/5 text-xs text-text-3 space-y-2">
                  <p>👤 Contacto: <span className="text-white">{s.contact_name || "N/A"}</span></p>
                  <p>📞 Tel: <span className="text-white">{s.phone || "N/A"}</span></p>
                </div>
              </Card>
            ))}
            <button 
              onClick={() => { setSelectedSupplier(null); setOpenSupplier(true); }}
              className="p-6 border-2 border-dashed border-border rounded-xl text-text-3 hover:text-white hover:border-white/20 transition-all flex flex-col items-center justify-center gap-3 bg-white/[0.02]"
            >
              <Plus className="w-8 h-8" />
              <span className="font-bold">Agregar Proveedor</span>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="warehouses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(w => (
              <Card key={w.id} className="p-6 bg-surface-card border-border hover:border-brand/40 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-status-ok/10 text-status-ok rounded-xl flex items-center justify-center">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => { setSelectedWarehouse(w); setOpenWarehouse(true); }}
                    className="p-2 text-text-3 hover:text-brand transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{w.name}</h3>
                <p className="text-sm text-text-3 mb-4 line-clamp-2">{w.location || "Sin dirección"}</p>
                <div className="flex gap-2">
                   <span className="px-2 py-0.5 bg-status-ok/20 text-status-ok rounded text-[10px] font-bold uppercase">Activo</span>
                </div>
              </Card>
            ))}
             <button 
              onClick={() => { setSelectedWarehouse(null); setOpenWarehouse(true); }}
              className="p-6 border-2 border-dashed border-border rounded-xl text-text-3 hover:text-white hover:border-white/20 transition-all flex flex-col items-center justify-center gap-3 bg-white/[0.02]"
            >
              <Plus className="w-8 h-8" />
              <span className="font-bold">Nuevo Almacén</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
