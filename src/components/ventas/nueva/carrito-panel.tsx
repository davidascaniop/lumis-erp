"use client";
import { useState, useMemo } from "react";
import { Loader2, Receipt, Trash2, X } from "lucide-react";
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
    toast.info("Cliente seleccionado");
  };

  const handleClearClient = () => {
    onSelectPartner(null);
    setNewClientName("");
    setNewClientRif("");
    setNewClientPhone("");
  };

  return (
    <div className="w-[380px] h-full flex flex-col p-4 flex-shrink-0 overflow-hidden">
      <div className="flex-1 bg-white shadow-sm rounded-[32px] border border-[#F1F5F9] flex flex-col overflow-hidden">
        
        {/* -- ENCABEZADO FIJO -- */}
        <div className="px-6 py-5 border-b border-[#F1F5F9] flex-shrink-0">
          <h2 className="text-[17px] font-bold text-[#1E293B]">Resumen del Pedido</h2>
        </div>

        {/* -- CUERPO CON SCROLL -- */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* -- CLIENTE -- */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              {cliente ? "Cliente Seleccionado" : "Nuevo Cliente"}
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  value={newClientName}
                  onChange={(e) => {
                    setNewClientName(e.target.value);
                    setShowSuggestions(true);
                    if (cliente) onSelectPartner(null);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Nombre y Apellido"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[14px] text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
                {cliente && (
                  <button
                    onClick={handleClearClient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-[100] overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0"
                      >
                        <div className="text-[14px] font-bold text-[#1E293B]">{p.name}</div>
                        <div className="text-[11px] text-[#64748B]">{p.rif || "Sin RIF"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={newClientRif}
                onChange={(e) => setNewClientRif(e.target.value)}
                placeholder="Cédula / RIF"
                disabled={!!cliente}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[14px] font-medium text-[#1E293B] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-all"
              />
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Teléfono"
                disabled={!!cliente}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[14px] font-medium text-[#1E293B] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-all"
              />
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9]" />

          {/* -- CONDICIÓN -- */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Condición</p>
            <div className="flex gap-8">
              <button
                onClick={() => onConditionChange("contado")}
                className="flex items-center gap-2.5"
              >
                <div className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center transition-all ${condition === "contado" ? "border-[#7C3AED] bg-[#7C3AED]" : "border-[#E2E8F0]"}`}>
                  {condition === "contado" && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                </div>
                <span className={`text-[15px] font-bold ${condition === "contado" ? "text-[#1E293B]" : "text-[#64748B]"}`}>Contado</span>
              </button>

              <button
                onClick={() => onConditionChange("credito")}
                className="flex items-center gap-2.5"
              >
                <div className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center transition-all ${condition === "credito" ? "border-[#7C3AED] bg-[#7C3AED]" : "border-[#E2E8F0]"}`}>
                  {condition === "credito" && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                </div>
                <span className={`text-[15px] font-bold ${condition === "credito" ? "text-[#1E293B]" : "text-[#64748B]"}`}>Crédito</span>
              </button>
            </div>
          </div>

          {/* -- MÉTODO PAGO / ABONO -- */}
          <div className="space-y-4">
             {condition === "credito" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Monto Abonado</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#64748B] opacity-50">$</span>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                      placeholder="Monto de entrega"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[15px] font-bold text-[#1E293B] focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                </div>
             )}

            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-2">Método de Cobro</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "efectivo", label: "Efectivo $" },
                { id: "zelle", label: "Zelle" },
                { id: "transferencia", label: "Transf." },
                { id: "pago_movil", label: "Pago Móvil" },
                { id: "punto", label: "Punto" },
                { id: "otro", label: "Otro" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-2.5 px-3 rounded-xl border text-[12px] font-bold transition-all
                    ${
                      method === m.id
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                    }
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9]" />

          {/* -- DETALLE DEL PEDIDO -- */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Ítems ({cart.length})</p>
            {cart.length === 0 ? (
               <div className="py-8 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2E8F0]">
                  <p className="text-[13px] font-bold text-[#94A3B8]">Sin productos seleccionados</p>
               </div>
            ) : (
                <div className="space-y-4">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex items-start justify-between group relative pr-8">
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="text-[14px] font-bold text-[#1E293B] leading-tight">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-[12px] text-[#64748B] font-medium">Cant: {item.qty}</span>
                           <span className="text-[12px] text-[#94A3B8] font-medium">x $ {Number(item.price_usd).toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="text-[15px] font-black text-[#1E293B] font-mono whitespace-nowrap">
                        ${(item.price_usd * item.qty).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>

        {/* -- TOTALES Y BOTONES FIJOS -- */}
        <div className="px-6 py-6 bg-white border-t border-[#F1F5F9] flex-shrink-0 space-y-5">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <span className="text-[14px] font-bold text-[#64748B]">Total:</span>
              <p className="text-[11px] font-bold text-[#94A3B8]">
                 Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="text-[32px] font-black text-[#7C3AED] leading-none tracking-tighter">
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={onSubmit}
              disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
              className={`
                w-full py-4 rounded-xl font-black text-[14px] transition-all shadow-lg active:scale-[0.98]
                ${
                  submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
                    ? "bg-[#F1F5F9] text-[#CBD5E1] border border-[#E2E8F0] shadow-none cursor-not-allowed"
                    : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-[#7C3AED]/20 border border-[#7C3AED]"
                }
              `}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> PROCESANDO...
                </div>
              ) : (
                "FINALIZAR COMPRA"
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button className="py-3 rounded-lg font-bold text-[12px] text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all tracking-wider">
                COTIZAR
              </button>
              <button className="py-3 rounded-lg font-bold text-[12px] text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all tracking-wider">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
