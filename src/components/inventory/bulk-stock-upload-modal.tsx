"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MF_SELECT } from "@/components/ui/modal-form";

interface ParsedRow {
  sku: string;
  name: string;
  type: string;
  qty: number;
  reason: string;
  product_id?: string;
  status: "valid" | "invalid_sku" | "invalid_qty" | "invalid_type";
}

export function BulkStockUploadModal({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { user } = useUser();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    async function fetchWarehouses() {
      if (!user?.company_id) return;
      const { data } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("company_id", user.company_id)
        .eq("is_active", true);
      setWarehouses(data ?? []);
    }
    fetchWarehouses();
  }, [user?.company_id]);

  function downloadTemplate() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "SKU,Nombre Producto,Tipo,Cantidad,Motivo\n" +
      "PROD-001,Harina Pan,Entrada,50,Compra a proveedor\n" +
      "PROD-002,Arroz Mary,Salida,10,Merma\n" +
      "PROD-003,Coca Cola,Entrada,120,Conteo físico";

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "plantilla_ajustes_stock.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function resetState() {
    setParsedData([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedData([]);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results: any) {
        const data = results.data as any[];
        
        // 1. Extraer todos los SKUs para validarlos
        const skus = data.map((row) => row.SKU?.trim()?.toUpperCase()).filter(Boolean);
        const uniqueSkus = Array.from(new Set(skus));

        // 2. Buscar en bd
        let existingProducts: any[] = [];
        if (uniqueSkus.length > 0 && user?.company_id) {
            const { data: pData } = await supabase
              .from("products")
              .select("id, sku")
              .eq("company_id", user.company_id)
              .in("sku", uniqueSkus);
            existingProducts = pData ?? [];
        }

        // 3. Mapear resultados
        const processedRows: ParsedRow[] = data.map((row) => {
          const rawSku = row.SKU?.trim()?.toUpperCase() || "";
          const rawQty = Number(row.Cantidad);
          
          let t = "IN";
          if (row.Tipo?.trim()?.toLowerCase() === "salida") t = "OUT";
          
          let status: ParsedRow["status"] = "valid";
          
          const productMatch = existingProducts.find(p => p.sku?.toUpperCase() === rawSku);

          if (!rawSku || !productMatch) {
            status = "invalid_sku";
          } else if (isNaN(rawQty) || rawQty <= 0) {
            status = "invalid_qty";
          }

          return {
             sku: rawSku || "(Vacío)",
             name: row["Nombre Producto"] || "(Sin Nombre)",
             type: t,
             qty: isNaN(rawQty) ? 0 : rawQty,
             reason: row.Motivo || "Carga masiva",
             product_id: productMatch?.id,
             status
          };
        });

        setParsedData(processedRows);
        setLoading(false);
      },
      error: function (err: any) {
        toast.error("Error leyendo CSV", { description: err.message });
        setLoading(false);
      },
    });
  };

  const confirmUpload = async () => {
    if (!user?.company_id || !warehouseId) {
       toast.error("Selecciona un depósito para cargar el stock.");
       return;
    }
    const validRows = parsedData.filter(r => r.status === "valid");
    if (validRows.length === 0) {
       toast.error("No hay registros válidos para procesar.");
       return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      for (const row of validRows) {
        if (!row.product_id) continue;
        
        const delta = row.type === "OUT" ? -Math.abs(row.qty) : Math.abs(row.qty);

        // 1. Obtener cantidad actual en el almacén
        const { data: currentStock } = await supabase
          .from("warehouse_stock")
          .select("qty")
          .eq("warehouse_id", warehouseId)
          .eq("product_id", row.product_id)
          .single();
        
        const currentQty = currentStock?.qty ?? 0;
        const newQty = currentQty + delta;
        
        // 2. Upsert stock por almacén
        await supabase.from("warehouse_stock").upsert(
            { warehouse_id: warehouseId, product_id: row.product_id, qty: newQty },
            { onConflict: "warehouse_id,product_id" }
        );

        // 3. Incrementar contador global en products
        await supabase.rpc("increment_product_stock", {
            p_product_id: row.product_id,
            p_delta: delta,
        });

        // 4. Registrar el movimiento
        await supabase.from("stock_movements").insert({
            company_id: user.company_id,
            product_id: row.product_id,
            warehouse_id: warehouseId,
            type: row.type, // IN o OUT
            qty: row.qty,
            reason: row.reason,
            user_id: authUser?.id,
        });
        
        successCount++;
      }

      toast.success(`${successCount} ajustes registrados correctamente.`);
      resetState();
      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast.error("Error en la carga masiva", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedData.filter(r => r.status === "valid").length;
  const invalidCount = parsedData.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) resetState();
        setOpen(val);
    }}>
      <DialogContent className="sm:max-w-[800px] bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
               <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100 text-teal-600">
                  <FileSpreadsheet className="w-5 h-5" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-bold text-slate-900 font-primary">Carga Masiva de Ajustes</DialogTitle>
                 <DialogDescription className="text-slate-500 text-sm">
                   Sube un CSV para registrar entradas y salidas múltiples.
                 </DialogDescription>
               </div>
          </div>
        </DialogHeader>

        <div className="pt-2 space-y-6">
          {!fileName && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">1. Plantilla</p>
                  <button 
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all font-montserrat"
                  >
                    <Download className="w-4 h-4 text-teal-600" />
                    Descargar CSV Listos
                  </button>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">2. Depósito de Ajuste *</p>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger className={`${MF_SELECT} h-9 text-xs font-montserrat`}>
                      <SelectValue placeholder="Seleccionar Depósito" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 font-montserrat">
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
             </div>
          )}

          {!fileName ? (
            <div 
                className="border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/50 p-8 flex flex-col items-center justify-center text-center hover:bg-teal-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                {loading ? (
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                ) : (
                    <>
                    <UploadCloud className="w-12 h-12 text-teal-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 font-primary mb-1">Subir Archivo CSV</h3>
                    <p className="text-slate-500 text-sm font-montserrat">Haz clic aquí para seleccionar tu archivo</p>
                    </>
                )}
                <input 
                    type="file" 
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                />
            </div>
          ) : (
             <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <div>
                         <h4 className="font-bold text-slate-900 text-sm font-primary">Vista Previa</h4>
                         <p className="text-xs text-slate-500">
                             {validCount} válidos, {invalidCount} con errores.
                         </p>
                     </div>
                     <button 
                         onClick={resetState}
                         className="text-xs font-bold text-teal-600 hover:text-teal-800 underline"
                     >
                         Subir otro archivo
                     </button>
                 </div>

                 <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase">SKU</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase">Producto</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-center">Tipo</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-right">Cantidad</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {parsedData.map((row, i) => (
                                <tr key={i} className={row.status !== "valid" ? "bg-red-50/50" : "bg-white"}>
                                    <td className="px-4 py-2.5 font-mono text-slate-700">{row.sku}</td>
                                    <td className="px-4 py-2.5 truncate max-w-[150px] text-slate-700">{row.name}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={`px-2 py-1 rounded inline-flex items-center justify-center font-bold text-[10px] uppercase tracking-wider ${row.type === 'IN' ? 'bg-status-ok/10 text-status-ok' : 'bg-status-danger/10 text-status-danger'}`}>
                                            {row.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-right text-slate-700 font-bold">{row.qty}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        {row.status === "valid" && <CheckCircle2 className="w-4 h-4 text-status-ok mx-auto" />}
                                        {row.status === "invalid_sku" && <span className="text-red-500 font-bold flex items-center justify-center gap-1.5 text-[10px] uppercase"><AlertCircle className="w-3.5 h-3.5"/> SKU no existe</span>}
                                        {row.status === "invalid_qty" && <span className="text-red-500 font-bold flex items-center justify-center gap-1.5 text-[10px] uppercase"><AlertCircle className="w-3.5 h-3.5"/> Cantidad Inválida</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>

                 <div className="pt-4">
                    <button
                        onClick={confirmUpload}
                        disabled={loading || validCount === 0 || !warehouseId}
                        className="w-full h-12 flex justify-center items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-md disabled:shadow-none font-bold hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? "Procesando Ajustes..." : `Confirmar Carga (${validCount} registros)`}
                    </button>
                    {!warehouseId && validCount > 0 && (
                        <p className="text-center text-red-500 text-[11px] font-bold uppercase mt-2">
                           ⚠️ DEBES SELECCIONAR UN DEPÓSITO ARRIBA PARA CONTINUAR
                        </p>
                    )}
                 </div>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
