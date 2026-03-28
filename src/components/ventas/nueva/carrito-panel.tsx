"use client";
import { useState, useMemo } from "react";
import { Loader2, Trash2, X, User, CreditCard, ShoppingBag, FileText, Wallet, ChevronDown } from "lucide-react";
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
  const [rifPrefix, setRifPrefix] = useState("V");

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

  const paymentMethods = [
    { id: "efectivo_usd", label: "Efectivo $" },
    { id: "efectivo_bs", label: "Efectivo Bs." },
    { id: "pago_movil", label: "Pago Móvil" },
    { id: "zelle", label: "Zelle" },
    { id: "transferencia", label: "Transf." },
    { id: "punto", label: "Punto" },
  ];

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-hidden bg-transparent">
      {/* ── HEADER PREMIUM ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 shadow-sm">
          <ShoppingBag className="w-5.5 h-5.5" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold font-outfit text-[#1A1125] tracking-tight">Resumen del Pedido</h2>
          <p className="text-[10px] font-bold text-text-3 font-outfit uppercase tracking-widest opacity-70">Confirmación de Venta</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-8 overflow-y-auto no-scrollbar pb-6 pr-1">
        {/* ── SECCIÓN: CLIENTE (ESTILO BURBUJA) ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-[0.15em] opacity-80">
            <User className="w-3.5 h-3.5" /> Datos del Cliente
          </div>
          <div className="space-y-3 relative">
            <div className="relative group">
              <input
                value={newClientName}
                onChange={(e) => {
                  setNewClientName(e.target.value);
                  setShowSuggestions(true);
                  if (cliente) onSelectPartner(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Nombre y Apellido"
                className="w-full px-5 py-3.5 rounded-2xl border border-[#E2E8F0] text-[14px] font-medium focus:outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all font-outfit bg-[#F8FAFC] placeholder:text-text-3/50"
              />
              {cliente && (
                <button onClick={handleClearClient} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 hover:text-danger p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 bg-[#F8FAFC] border-b border-[#EDF2F7]">
                  <p className="text-[9px] font-bold text-text-3 uppercase tracking-widest px-2">Sugerencias encontradas</p>
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full px-4 py-3 text-left hover:bg-brand/5 border-b border-[#F1F5F9] last:border-0 transition-colors"
                  >
                    <div className="text-[13px] font-bold text-[#1A1125] font-outfit">{p.name}</div>
                    <div className="text-[10px] text-brand/70 font-bold font-outfit uppercase tracking-wide">{p.rif || "Sin RIF"}</div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div className="relative flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/5 transition-all">
                <select 
                  value={rifPrefix}
                  onChange={(e) => setRifPrefix(e.target.value)}
                  disabled={!!cliente}
                  className="bg-transparent pl-4 pr-2 py-3.5 text-[14px] font-bold text-brand font-outfit outline-none cursor-pointer disabled:opacity-50 appearance-none w-full"
                >
                  <option value="V">V -</option>
                  <option value="J">J -</option>
                  <option value="E">E -</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand pointer-events-none" />
              </div>
              <input
                value={newClientRif}
                onChange={(e) => setNewClientRif(e.target.value)}
                placeholder="Cédula / RIF"
                disabled={!!cliente}
                className="w-full px-5 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[14px] font-medium outline-none font-outfit focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all disabled:opacity-50 placeholder:text-text-3/50"
              />
            </div>
            <input
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Número de Teléfono"
              disabled={!!cliente}
              className="w-full px-5 py-3.5 rounded-2xl border border-[#E2E8F0] text-[14px] font-medium focus:outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all font-outfit bg-[#F8FAFC] disabled:opacity-50 placeholder:text-text-3/50"
            />
          </div>
        </div>

        {/* ── SECCIÓN: MODALIDAD (ESTILO TABS) ── */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-[0.15em] opacity-80">
            <CreditCard className="w-3.5 h-3.5" /> Modalidad de Pago
          </div>
          
          <div className="flex p-1.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] gap-1.5">
             <button 
                onClick={() => onConditionChange("contado")}
                className={`flex-1 py-3.5 rounded-xl text-[13px] font-bold font-outfit transition-all ${condition === "contado" ? "bg-white text-brand shadow-sm border border-[#E2E8F0]" : "text-text-3 hover:text-text-1"}`}
             >
                PAGO DE CONTADO
             </button>
             <button 
                onClick={() => onConditionChange("credito")}
                className={`flex-1 py-3.5 rounded-xl text-[13px] font-bold font-outfit transition-all ${condition === "credito" ? "bg-white text-brand shadow-sm border border-[#E2E8F0]" : "text-text-3 hover:text-text-1"}`}
             >
                VENTA A CRÉDITO
             </button>
          </div>

          {condition === "credito" && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-500 mt-4">
               <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-brand font-outfit">$</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                    placeholder="Monto de abono inicial..."
                    className="w-full pl-9 pr-5 py-4 rounded-2xl border-2 border-brand/20 bg-brand/[0.03] text-lg font-bold text-brand focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 font-outfit transition-all placeholder:text-brand/30"
                  />
               </div>
               <div className="flex items-center gap-2 mt-2.5 ml-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  <p className="text-[11px] text-text-3 font-bold font-outfit uppercase tracking-wider opacity-60">Indique el pago inicial recibido</p>
               </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-[0.15em] opacity-80">
               <Wallet className="w-3.5 h-3.5" /> Método de Pago
            </div>
            <div className="grid grid-cols-3 gap-2.5">
               {paymentMethods.map((m) => (
                 <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-3 rounded-xl text-[11px] font-bold font-outfit transition-all uppercase tracking-wider border text-center
                    ${method === m.id ? "bg-brand text-white border-brand shadow-brand/20 shadow-lg scale-105 z-10" : "bg-white text-text-2 border-[#EDF2F7] hover:border-brand/30 hover:bg-[#F8FAFC]"}
                  `}
                 >
                  {m.label}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: ITEMS (MAS ESPACIOSA) ── */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-text-3 font-bold text-[11px] font-outfit uppercase tracking-[0.15em] opacity-80">Artículos en Carrito</p>
            <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[10px] font-bold text-text-2 font-outfit">{cart.length} items</span>
          </div>
          {cart.length === 0 ? (
            <div className="py-12 text-center rounded-[32px] border-2 border-dashed border-[#F1F5F9] bg-[#F8FAFC]/50">
               <ShoppingBag className="w-8 h-8 text-text-3 opacity-20 mx-auto mb-3" />
               <p className="text-[11px] font-bold font-outfit uppercase text-text-3 opacity-40 tracking-widest">Sin productos seleccionados</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
              {cart.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EDF2F7] group hover:border-brand/20 transition-all">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4.5 h-4.5 text-brand/60" />
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                       <span className="text-[14px] font-bold text-[#1A1125] truncate font-outfit max-w-[140px] tracking-tight">{item.name}</span>
                       <span className="text-[11px] font-bold text-text-3 font-outfit opacity-80">
                         {item.qty} un x ${Number(item.price_usd).toFixed(2)}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-[#1A1125] font-outfit tracking-tighter">${(item.price_usd * item.qty).toFixed(2)}</span>
                    <button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-lg bg-danger/5 text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:text-white">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TOTALES Y ACCIONES (PIE DE BURBUJA) ── */}
      <div className="pt-8 border-t-2 border-dashed border-[#F1F5F9] space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-text-3 font-outfit uppercase tracking-[0.2em] opacity-60">Monto Total</span>
              <p className="text-[12px] font-bold text-brand font-outfit opacity-80 uppercase mt-0.5 tracking-wider">
                Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
              </p>
           </div>
           <div className="flex items-baseline gap-1 bg-brand/5 px-5 py-2.5 rounded-2xl border border-brand/10">
             <span className="text-3xl font-bold text-brand font-outfit tracking-tighter">
               $ {total.toFixed(2)}
             </span>
             <span className="text-[11px] font-bold text-brand/60 font-outfit uppercase">usd</span>
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <button
             onClick={onSubmit}
             disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
             className={`w-full py-4.5 rounded-[20px] font-bold font-outfit text-[14px] uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 ${
               submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
               ? "bg-[#F4F7FA] text-[#B0BCCB] cursor-not-allowed shadow-none"
               : "bg-brand text-white shadow-brand/30 hover:shadow-brand-lg hover:opacity-95"
             }`}
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "PROCESAR VENTA"}
           </button>
           
           <div className="grid grid-cols-2 gap-3 pb-2">
              <button className="py-3.5 rounded-xl font-bold font-outfit text-[11px] uppercase tracking-widest border-2 border-[#E2E8F0] text-text-2 hover:bg-[#F8FAFC] transition-all active:scale-95">
                Generar Cotización
              </button>
              <button className="py-3.5 rounded-xl font-bold font-outfit text-[11px] uppercase tracking-widest border-2 border-danger/10 text-danger hover:bg-danger/5 transition-all active:scale-95">
                Limpiar Carrito
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
