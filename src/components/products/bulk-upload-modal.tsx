"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Warehouse } from "lucide-react";

export function BulkUploadModal({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWarehouses() {
      if (!user?.company_id) return;
      const { data } = await supabase
        .from("warehouses")
        .select("*")
        .eq("company_id", user.company_id)
        .eq("is_active", true);
      setWarehouses(data || []);
    }
    fetchWarehouses();
  }, [user?.company_id]);

  // Template to download
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "name,sku,category,brand,department,supplier_code,cost_usd,price_usd,price_usd_2,price_usd_3,price_usd_4,stock,unit,description,image_url\n" +
      "Producto Ejemplo,PROD-001,General,MarcaX,DeptoY,SUP-1,7.50,10.00,9.00,8.00,7.00,100,Unidad,Delicioso,https://...";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos_lumis.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setParsedData([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results: any) {
        const data = results.data as any[];
        const validData = [];
        const errs = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row.name || !row.sku) {
            errs.push(`Fila ${i + 2}: Nombre y SKU son obligatorios.`);
            continue;
          }
          validData.push({
            name: row.name,
            sku: row.sku,
            category: row.category || "General",
            brand: row.brand || null,
            department: row.department || null,
            supplier_code: row.supplier_code || null,
            cost_usd: Number(row.cost_usd) || 0,
            price_usd: Number(row.price_usd) || 0,
            price_usd_2: Number(row.price_usd_2) || 0,
            price_usd_3: Number(row.price_usd_3) || 0,
            price_usd_4: Number(row.price_usd_4) || 0,
            stock: Number(row.stock) || 0,
            unit: row.unit || "Unidad",
            description: row.description || null,
            image_url: row.image_url || null,
            status: Number(row.stock) > 0 ? "active" : "out_of_stock",
          });
        }

        setErrors(errs);
        setParsedData(validData);
      },
      error: function (error: any) {
        setErrors(["Error al procesar CSV: " + error.message]);
      }
    });
  };

  const confirmUpload = async () => {
    if (!user?.company_id || parsedData.length === 0) return;
    setLoading(true);

    try {
      const payload = parsedData.map(item => ({
        ...item,
        company_id: user.company_id
      }));

      // Upsert products: Si el SKU ya existe para esta empresa, lo actualiza (Ideal para masivas rápidas)
      const { data: insertedProducts, error: pError } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "company_id,sku" })
        .select("id, name, sku, stock");
      if (pError) throw pError;

      // If warehouse is selected, insert warehouse_stock
      if (selectedWarehouse && insertedProducts) {
        const stockPayload = insertedProducts.map(p => ({
          warehouse_id: selectedWarehouse,
          product_id: p.id,
          qty: p.stock
        }));

        const { error: sError } = await supabase.from("warehouse_stock").insert(stockPayload);
        if (sError) {
          console.error("Bulk stock error:", sError);
          toast.warning("Productos creados, pero falló la asignación al almacén.");
        }
      }

      toast.success(`${parsedData.length} productos registrados correctamente.`);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast.error("Error en la carga masiva", { description: error.message || JSON.stringify(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-white border-slate-200">
        <DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-[#E040FB]/10 flex items-center justify-center text-[#E040FB]">
                  <FileSpreadsheet className="w-5 h-5" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-bold text-slate-900">Carga Masiva (CSV)</DialogTitle>
                 <DialogDescription className="text-slate-500">
                   Sube cientos de productos de forma automática.
                 </DialogDescription>
               </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors p-1 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </DialogHeader>

        <div className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">1. Estructura</p>
              <button 
                onClick={downloadTemplate}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Descargar Plantilla CSV
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">2. Destino del Stock</p>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="h-9 bg-white border-slate-200 text-slate-900 rounded-lg text-xs shadow-sm">
                  <SelectValue placeholder="Almacén (Opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>🏪 {w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
             <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
             <p className="text-[11px] text-blue-700 leading-normal">
                <span className="font-bold">Modo Inteligente (Upsert):</span> Si el sistema detecta un <span className="font-bold">SKU</span> que ya existe en tu inventario, lo <span className="font-bold text-blue-900 underline">actualizará</span> con los datos del CSV en lugar de crear uno nuevo. Ideal para corregir precios o costos masivamente.
             </p>
          </div>

          <div 
            className="border-2 border-dashed border-[#E040FB]/40 rounded-2xl bg-[#E040FB]/5 p-8 flex flex-col items-center justify-center text-center hover:bg-[#E040FB]/10 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-[#E040FB] mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Subir Archivo CSV</h3>
            <p className="text-slate-500 text-sm">Haz clic aquí para seleccionar tu archivo</p>
            <input 
              type="file" 
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
              <h4 className="flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertCircle className="w-4 h-4" /> Problemas encontrados:
              </h4>
              <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {errors.length > 5 && <li>Y {errors.length - 5} errores más...</li>}
              </ul>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">¡Archivo listo!</h4>
                  <p className="text-xs text-emerald-700">{parsedData.length} productos válidos encontrados.</p>
                </div>
              </div>
              <button
                onClick={confirmUpload}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? "Importando..." : "Confirmar Importación"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
