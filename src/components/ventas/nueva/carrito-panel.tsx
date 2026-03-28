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
    <div className="w-full h-full flex flex-col p-6 overflow-hidden bg-white">
      {/* ── HEADER COMPACTO ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-brand/5 flex items-center justify-center text-brand">
          <ShoppingBag className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-lg font-bold font-outfit text-[#1A1125]">Resumen del Pedido</h2>
      </div>

      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar pb-4 pr-1">
        {/* ── SECCIÓN: CLIENTE ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
            <User className="w-3 h-3" /> Datos del Cliente
          </div>
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
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 transition-all font-outfit bg-[#F8FAFC]"
            />
            {cliente && (
              <button onClick={handleClearClient} className="absolute right-3 top-3 text-text-3 hover:text-danger p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-[100] overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full px-4 py-2.5 text-left hover:bg-brand/5 border-b border-[#F1F5F9] last:border-0"
                  >
                    <div className="text-[12px] font-bold text-text-1 font-outfit">{p.name}</div>
                    <div className="text-[9px] text-text-3 font-outfit uppercase">{p.rif || "Sin RIF"}</div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-brand/40 transition-all">
                <select 
                  value={rifPrefix}
                  onChange={(e) => setRifPrefix(e.target.value)}
                  disabled={!!cliente}
                  className="bg-transparent pl-3 pr-1 py-2.5 text-[13px] font-bold text-brand font-outfit outline-none cursor-pointer disabled:opacity-50 appearance-none"
                >
                  <option value="V">V</option>
                  <option value="J">J</option>
                  <option value="E">E</option>
                </select>
                <input
                  value={newClientRif}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Limitar a números si es posible o mantener como está
                    setNewClientRif(val);
                  }}
                  placeholder="Cédula / RIF"
                  disabled={!!cliente}
                  className="w-full px-2 py-2.5 bg-transparent text-[13px] font-medium outline-none font-outfit disabled:opacity-50"
                />
              </div>
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Teléfono"
                disabled={!!cliente}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 transition-all font-outfit bg-[#F8FAFC] disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: MODALIDAD Y MÉTODOS ── */}
        <div className="space-y-4 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
               <CreditCard className="w-3 h-3" /> Modalidad de Pago
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                type="radio" 
                name="condition"
                checked={condition === "contado"} 
                onChange={() => onConditionChange("contado")}
                className="w-3.5 h-3.5 accent-brand"
               />
               <span className={`text-[13px] font-bold font-outfit ${condition === "contado" ? "text-[#1A1125]" : "text-text-3"}`}>Contado</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                type="radio" 
                name="condition"
                checked={condition === "credito"} 
                onChange={() => onConditionChange("credito")}
                className="w-3.5 h-3.5 accent-brand"
               />
               <span className={`text-[13px] font-bold font-outfit ${condition === "credito" ? "text-[#1A1125]" : "text-text-3"}`}>Crédito</span>
             </label>
          </div>

          {condition === "credito" && (
            <div className="animate-in slide-in-from-top-2 duration-300">
               <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-brand font-outfit">$</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                    placeholder="Ingrese monto a abonar..."
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-brand/20 bg-brand/[0.02] text-[13px] font-bold text-brand focus:outline-none focus:border-brand font-outfit"
                  />
               </div>
               <p className="text-[10px] text-text-3 font-outfit mt-1 ml-1 opacity-70 italic">Ingrese el pago inicial del cliente</p>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
               <Wallet className="w-3 h-3" /> Método de Pago
            </div>
            <div className="grid grid-cols-3 gap-1.5">
               {paymentMethods.map((m) => (
                 <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-2 rounded-lg text-[10px] font-bold font-outfit transition-all uppercase tracking-tighter border
                    ${method === m.id ? "bg-brand text-white border-brand shadow-md" : "bg-[#F8FAFC] text-text-3 border-[#EDF2F7] hover:bg-white hover:border-brand/30"}
                  `}
                 >
                  {m.label}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: ITEMS ── */}
        <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
          <p className="text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">Productos Seleccionados</p>
          {cart.length === 0 ? (
            <div className="py-4 text-center opacity-20">
               <p className="text-[11px] font-bold font-outfit uppercase">Sin items</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
              {cart.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-text-3 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                       <span className="text-[12px] font-bold text-text-1 truncate font-outfit max-w-[120px]">{item.name}</span>
                       <span className="text-[10px] font-medium text-text-3 font-outfit leading-none mt-0.5">
                         {item.qty}x ${Number(item.price_usd).toFixed(2)}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#1A1125] font-outfit">${(item.price_usd * item.qty).toFixed(2)}</span>
                    <button onClick={() => onRemove(item.id)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TOTALES Y ACCIONES ── */}
      <div className="pt-4 border-t border-[#F1F5F9] space-y-4">
        <div className="flex flex-col gap-0.5 items-end">
           <div className="flex items-baseline gap-2">
             <span className="text-[13px] font-bold text-text-3 font-outfit uppercase tracking-wider">Total Venta:</span>
             <span className="text-xl font-bold text-brand font-outfit">
               $ {total.toFixed(2)}
             </span>
           </div>
           <p className="text-[10px] font-bold text-[#94A3B8] font-outfit uppercase">
             Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })} <span className="text-[8px] font-medium opacity-50">(BCV: {bcvRate.toFixed(2)})</span>
           </p>
        </div>

        <div className="flex flex-col gap-1.5">
           <button
             onClick={onSubmit}
             disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
             className={`w-full py-3 rounded-lg font-bold font-outfit text-[12px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${
               submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
               ? "bg-[#F4F7FA] text-[#B0BCCB] cursor-not-allowed shadow-none"
               : "bg-brand text-white shadow-brand/10 hover:opacity-90"
             }`}
           >
             {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Finalizar Pedido"}
           </button>
           
           <div className="grid grid-cols-2 gap-1.5">
              <button className="py-2.5 rounded-lg font-bold font-outfit text-[10px] uppercase tracking-widest border border-[#E2E8F0] text-text-2 hover:bg-[#F8FAFC] transition-all">
                Cotizar
              </button>
              <button className="py-2.5 rounded-lg font-bold font-outfit text-[10px] uppercase tracking-widest border border-danger/5 text-danger hover:bg-danger/5 transition-all">
                Cancelar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
