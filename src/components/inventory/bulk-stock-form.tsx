"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LABEL_CLS =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-montserrat";
const SELECT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand font-montserrat";

interface BulkStockFormProps {
  onSuccess?: () => void;
}

export function BulkStockForm({ onSuccess }: BulkStockFormProps) {
  const { user } = useUser();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const fetchWarehouses = useCallback(async () => {
    if (!user?.company_id) return;
    const { data } = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("company_id", user.company_id)
      .eq("is_active", true);
    setWarehouses(data ?? []);
  }, [user?.company_id]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // ─── Descargar plantilla ────────────────────────────────────────────────────
  function downloadTemplate() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "sku,qty\n" +
      "PROD-001,50\n" +
      "PROD-002,120\n" +
      "PROD-003,30";

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "plantilla_stock_lumis.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ─── Procesar archivo ──────────────────────────────────────────────────────
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setParsedData([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results: any) {
        const data = results.data as any[];
        const validData: { sku: string; qty: number }[] = [];
        const errs: string[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row.sku) {
            errs.push(`Fila ${i + 2}: SKU es obligatorio.`);
            continue;
          }
          if (!row.qty || isNaN(Number(row.qty))) {
            errs.push(`Fila ${i + 2}: Cantidad inválida para SKU "${row.sku}".`);
            continue;
          }
          validData.push({
            sku: row.sku.trim(),
            qty: Number(row.qty),
          });
        }

        setErrors(errs);
        setParsedData(validData);
      },
      error: function (error: any) {
        setErrors(["Error al procesar CSV: " + error.message]);
      },
    });
  }

  // ─── Confirmar carga ───────────────────────────────────────────────────────
  async function confirmUpload() {
    if (!user?.company_id || parsedData.length === 0 || !warehouseId) {
      toast.error("Selecciona un depósito y sube un archivo válido.");
      return;
    }

    setLoading(true);
    let successCount = 0;
    const uploadErrors: string[] = [];

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      for (const row of parsedData) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("id")
            .eq("company_id", user.company_id)
            .ilike("sku", row.sku)
            .single();

          if (!product) {
            uploadErrors.push(`SKU "${row.sku}" no encontrado.`);
            continue;
          }

          await supabase.from("warehouse_stock").upsert(
            { warehouse_id: warehouseId, product_id: product.id, qty: row.qty },
            { onConflict: "warehouse_id,product_id" }
          );

          await supabase.from("stock_movements").insert({
            company_id: user.company_id,
            product_id: product.id,
            warehouse_id: warehouseId,
            type: "ADJUSTMENT",
            qty: row.qty,
            reason: "Carga masiva vía CSV",
            user_id: authUser?.id,
          });

          successCount++;
        } catch {
          uploadErrors.push(`Error al procesar "${row.sku}".`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} productos actualizados correctamente.`);
      }
      if (uploadErrors.length > 0) {
        setErrors(uploadErrors);
      }

      setParsedData([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (error: any) {
      toast.error("Error en la carga masiva", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  // ─── Reset ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setParsedData([]);
    setErrors([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: Depósito + Plantilla */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>1. Seleccionar Depósito *</label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className={SELECT_CLS}>
              <SelectValue placeholder="Depósito destino" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl">
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={LABEL_CLS}>2. Descargar Plantilla</label>
          <button
            type="button"
            onClick={downloadTemplate}
            className="w-full h-11 flex items-center justify-center gap-2 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4 text-brand" />
            Plantilla CSV
          </button>
        </div>
      </div>

      {/* Paso 2: Subir Archivo */}
      <div>
        <label className={LABEL_CLS}>3. Subir Archivo CSV</label>
        {fileName ? (
          <div className="flex items-center justify-between h-14 px-5 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-brand" />
              <span className="text-sm font-semibold text-slate-900">{fileName}</span>
            </div>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-brand/30 rounded-2xl bg-brand/5 hover:bg-brand/10 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-10 h-10 text-brand mb-3" />
            <p className="text-sm font-bold text-slate-900">Haz clic para subir</p>
            <p className="text-xs text-slate-400 mt-1">Formato: CSV (sku, qty)</p>
          </div>
        )}
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 max-h-36 overflow-y-auto">
          <h4 className="flex items-center gap-2 text-sm font-bold text-red-600">
            <AlertCircle className="w-4 h-4" /> Problemas encontrados:
          </h4>
          <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
            {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 5 && <li>Y {errors.length - 5} errores más...</li>}
          </ul>
        </div>
      )}

      {/* Confirmación */}
      {parsedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">¡Archivo listo!</h4>
              <p className="text-xs text-emerald-700">{parsedData.length} productos válidos encontrados.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmUpload}
            disabled={loading || !warehouseId}
            className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Procesando..." : "Confirmar Carga"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
