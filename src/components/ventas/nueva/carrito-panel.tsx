"use client";
import { useState, useMemo } from "react";
import { Loader2, Trash2, X, User, CreditCard, ShoppingBag, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";

export function CarritoPanel({
  cart,
  onUpdateQty,
  onRemove,
  condition,
  onConditionChange,
  method,
  onMethodChange,
  subtotal,
  bcvRate,
  cliente,
  onSubmit,
  submitting,
  amountPaid,
  onAmountPaidChange,
  newClientName,
  setNewClientName,
  newClientRif,
  setNewClientRif,
  newClientPhone,
  setNewClientPhone,
  partners,
  onSelectPartner,
}: {
  cart: any[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  condition: "contado" | "credito";
  onConditionChange: (v: "contado" | "credito") => void;
  method: string;
  onMethodChange: (v: string) => void;
  subtotal: number;
  bcvRate: number;
  cliente: any | null;
  onSubmit: () => void;
  submitting: boolean;
  amountPaid: number;
  onAmountPaidChange: (v: number) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientRif: string;
  setNewClientRif: (v: string) => void;
  newClientPhone: string;
  setNewClientPhone: (v: string) => void;
  partners: any[];
  onSelectPartner: (p: any | null) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const total = subtotal;
  const totalBs = total * bcvRate;

  const suggestions = useMemo(() => {
    if (!newClientName || newClientName.length < 2 || cliente) return [];
    return partners
      .filter((p) => p.name.toLowerCase().includes(newClientName.toLowerCase()))
      .slice(0, 5);
  }, [partners, newClientName, cliente]);

  const handleSelectSuggestion = (p: any) => {
    onSelectPartner(p);
    setNewClientName(p.name);
    setNewClientRif(p.rif || "");
    setNewClientPhone(p.phone || "");
    setShowSuggestions(false);
  };

  const handleClearClient = () => {
    onSelectPartner(null);
    setNewClientName("");
    setNewClientRif("");
    setNewClientPhone("");
  };

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden bg-white">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold font-outfit text-[#1A1125]">
          Resumen del Pedido
        </h2>
      </div>

      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar pb-6">
        {/* ── SECCIÓN: CLIENTE ── */}
        <div className="space-y-3">
          <p className="text-[12px] font-bold text-text-3 font-outfit uppercase tracking-wider">Nuevo Cliente</p>
          <div className="space-y-2 relative">
            <input
              value={newClientName}
              onChange={(e) => {
                setNewClientName(e.target.value);
                setShowSuggestions(true);
                if (cliente) onSelectPartner(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Nombre y Apellido"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-sm font-medium focus:outline-none focus:border-brand/40 transition-all font-outfit bg-[#F8FAFC]"
            />
            {cliente && (
              <button onClick={handleClearClient} className="absolute right-3 top-3.5 text-text-3 hover:text-danger">
                <X className="w-4 h-4" />
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-[100] overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full px-4 py-3 text-left hover:bg-brand/5 border-b border-[#F1F5F9] last:border-0"
                  >
                    <div className="text-[13px] font-bold text-text-1 font-outfit">{p.name}</div>
                    <div className="text-[10px] text-text-3 font-outfit uppercase">{p.rif || "Sin RIF"}</div>
                  </button>
                ))}
              </div>
            )}

            <input
              value={newClientRif}
              onChange={(e) => setNewClientRif(e.target.value)}
              placeholder="Cédula / RIF"
              disabled={!!cliente}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-sm font-medium focus:outline-none focus:border-brand/40 transition-all font-outfit bg-[#F8FAFC] disabled:opacity-50"
            />
            <input
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Teléfono"
              disabled={!!cliente}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-sm font-medium focus:outline-none focus:border-brand/40 transition-all font-outfit bg-[#F8FAFC] disabled:opacity-50"
            />
          </div>
        </div>

        {/* ── SECCIÓN: CONDICIÓN PAGO ── */}
        <div className="flex items-center gap-6 py-2">
           <label className="flex items-center gap-2 cursor-pointer group">
             <input 
              type="radio" 
              checked={condition === "contado"} 
              onChange={() => onConditionChange("contado")}
              className="w-4 h-4 accent-brand"
             />
             <span className={`text-sm font-bold font-outfit ${condition === "contado" ? "text-[#1A1125]" : "text-text-3"}`}>Contado</span>
           </label>
           <label className="flex items-center gap-2 cursor-pointer group">
             <input 
              type="radio" 
              checked={condition === "credito"} 
              onChange={() => onConditionChange("credito")}
              className="w-4 h-4 accent-brand"
             />
             <span className={`text-sm font-bold font-outfit ${condition === "credito" ? "text-[#1A1125]" : "text-text-3"}`}>Crédito</span>
           </label>
        </div>

        {/* ── SECCIÓN: LISTA DE PRODUCTOS ── */}
        <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
          {cart.length === 0 ? (
            <div className="py-8 text-center opacity-30">
               <p className="text-xs font-bold font-outfit uppercase tracking-widest">Sin productos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-text-3 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                       <span className="text-[13px] font-bold text-text-1 truncate font-outfit">{item.name}</span>
                       <span className="text-[11px] font-medium text-text-3 font-outfit italic">
                         ({item.qty}x ${Number(item.price_usd).toFixed(2)})
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#1A1125] font-outfit">${(item.price_usd * item.qty).toFixed(2)}</span>
                    <button onClick={() => onRemove(item.id)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECCIÓN: TOTALES ── */}
      <div className="pt-6 border-t border-[#F1F5F9] space-y-6">
        <div className="flex flex-col gap-1 items-end">
           <div className="flex items-baseline gap-3">
             <span className="text-xl font-bold text-[#1A1125] font-outfit">Total:</span>
             <span className="text-4xl font-bold text-brand font-outfit tracking-tighter">
               $ {total.toFixed(2)}
             </span>
           </div>
           <p className="text-[12px] font-bold text-text-3 font-outfit uppercase">
             Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })} <span className="text-[10px] font-medium opacity-60">(Tasa BCV: {bcvRate.toFixed(2)})</span>
           </p>
        </div>

        {/* ── ACCIONES ── */}
        <div className="flex flex-col gap-2">
           <button
             onClick={onSubmit}
             disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
             className={`w-full py-4 rounded-xl font-bold font-outfit text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
               submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
               ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed shadow-none"
               : "bg-brand text-white shadow-brand/20 hover:opacity-90"
             }`}
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Finalizar Pedido"}
           </button>
           
           <button className="w-full py-3.5 rounded-xl font-bold font-outfit text-xs uppercase tracking-widest border border-[#E2E8F0] text-text-2 hover:bg-[#F8FAFC] transition-all">
             Cotizar
           </button>
           
           <button className="w-full py-3.5 rounded-xl font-bold font-outfit text-xs uppercase tracking-widest border border-danger/10 text-danger hover:bg-danger/5 transition-all">
             Cancelar Pedido
           </button>
        </div>
      </div>
    </div>
  );
}
