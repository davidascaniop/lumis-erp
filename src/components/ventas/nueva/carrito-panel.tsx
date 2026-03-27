"use client";
import { useState, useMemo } from "react";
import { Loader2, Receipt, Trash2, X } from "lucide-react";

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

  // Filtrar sugerencias de clientes
  const suggestions = useMemo(() => {
    if (!newClientName || newClientName.length < 2 || cliente) return [];
    return partners
      .filter((p) =>
        p.name.toLowerCase().includes(newClientName.toLowerCase()),
      )
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
    <div className="w-[360px] flex-shrink-0 flex flex-col items-center py-4 px-2 overflow-y-auto no-scrollbar">
      <div className="w-full bg-[#FAFAFC] shadow-sm rounded-[24px] border border-[#F1F5F9] flex flex-col overflow-hidden">
        
        {/* -- ENCABEZADO -- */}
        <div className="px-6 py-5 border-b border-[#F1F5F9]">
          <h2 className="text-[17px] font-bold text-[#1E293B]">Resumen del Pedido</h2>
        </div>

        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* -- CLIENTE -- */}
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-[#64748B]">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[14px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
                {cliente && (
                  <button
                    onClick={handleClearClient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-50 overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0"
                      >
                        <div className="text-[14px] font-medium text-[#1E293B]">{p.name}</div>
                        <div className="text-[12px] text-[#64748B]">{p.rif || "Sin RIF"}</div>
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
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[14px] text-[#1E293B] placeholder:text-[#94A3B8] disabled:bg-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Teléfono"
                disabled={!!cliente}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[14px] text-[#1E293B] placeholder:text-[#94A3B8] disabled:bg-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9] w-full" />

          {/* -- CONDICIÓN -- */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onConditionChange("contado")}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${condition === "contado" ? "border-[#7C3AED]" : "border-[#CBD5E1]"}`}>
                {condition === "contado" && <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />}
              </div>
              <span className={`text-[15px] font-medium ${condition === "contado" ? "text-[#1E293B]" : "text-[#475569]"}`}>Contado</span>
            </button>

            <button
              onClick={() => onConditionChange("credito")}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${condition === "credito" ? "border-[#7C3AED]" : "border-[#CBD5E1]"}`}>
                {condition === "credito" && <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />}
              </div>
              <span className={`text-[15px] font-medium ${condition === "credito" ? "text-[#1E293B]" : "text-[#475569]"}`}>Crédito</span>
            </button>
          </div>

          {/* -- MÉTODO PAGO Y ABONO -- */}
          <div className="space-y-3">
             {condition === "credito" && (
                <div className="relative mt-2">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[#64748B]">$</span>
                   <input
                     type="number"
                     value={amountPaid}
                     onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                     placeholder="Abono Inicial"
                     className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[14px] font-medium focus:outline-none focus:border-[#7C3AED]"
                   />
                </div>
             )}

            <div className="grid grid-cols-2 gap-2 mt-2">
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
                    py-2 px-3 rounded-xl border text-[12px] font-medium transition-colors
                    ${
                      method === m.id
                        ? "bg-[#F3E8FF] border-[#7C3AED] text-[#7C3AED]"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                    }
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9] w-full" />

          {/* -- DETALLE DEL PEDIDO -- */}
          <div className="space-y-3">
            {cart.length === 0 ? (
               <p className="text-[14px] text-[#94A3B8] text-center my-4">No hay ítems</p>
            ) : (
                <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex items-start justify-between group relative">
                      <div className="flex items-start gap-2 max-w-[70%]">
                        <Receipt className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                        <span className="text-[14px] font-medium text-[#475569] leading-tight">
                          {item.name} <span className="text-[13px] text-[#94A3B8]">({item.qty}x ${Number(item.price_usd).toFixed(2)})</span>
                        </span>
                      </div>
                      <span className="text-[15px] font-bold text-[#1E293B]">
                        ${(item.price_usd * item.qty).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 bg-red-50 text-red-500 rounded-md transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
            )}
          </div>

          <div className="h-px bg-[#F1F5F9] w-full" />

          {/* -- TOTALES -- */}
          <div className="flex flex-col pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[18px] font-bold text-[#1E293B]">Total:</span>
              <span className="text-[28px] font-bold text-[#7C3AED] tracking-tight">
                $ {total.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
               <p className="text-[13px] font-medium text-[#64748B]">
                 Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })} <span className="text-[#94A3B8]">(Tasa Bcv: {bcvRate.toFixed(2)})</span>
               </p>
            </div>
          </div>

          {/* -- BOTONES DE ACCIÓN -- */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={onSubmit}
              disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
              className={`
                w-full py-3.5 rounded-full font-semibold text-[14px] transition-all
                ${
                  submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
                    ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                    : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm hover:shadow-md"
                }
              `}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </div>
              ) : (
                "FINALIZAR PEDIDO"
              )}
            </button>

            <button className="w-full py-3.5 rounded-full font-semibold text-[14px] text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
              COTIZAR
            </button>
            
            <button className="w-full py-3.5 rounded-full font-semibold text-[14px] text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
              CANCELAR PEDIDO
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
