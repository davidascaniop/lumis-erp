"use client";
import { useState, useMemo } from "react";
import { Loader2, Trash2, X, User, CreditCard, ShoppingBag } from "lucide-react";
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
    toast.info("Cliente identificado");
  };

  const handleClearClient = () => {
    onSelectPartner(null);
    setNewClientName("");
    setNewClientRif("");
    setNewClientPhone("");
  };

  return (
    <div className="w-full h-full flex flex-col p-4 xl:p-6 overflow-hidden bg-[#F8F9FA]">
      <div className="flex-1 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-[48px] border border-[#F1F5F9] flex flex-col overflow-hidden p-8 xl:p-12 space-y-10">
        
        {/* -- ENCABEZADO -- */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold font-outfit text-[#1A1125] tracking-tight">
              Resumen del Pedido
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand/40"></div>
              <p className="text-[12px] font-bold text-text-3 font-outfit uppercase tracking-[0.2em]">Facturación Digital LUMIS</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-brand/5 text-brand border border-brand/10">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-bold font-outfit">{cart.length} Ítems</span>
          </div>
        </div>

        {/* -- CONTENIDO EN DOS COLUMNAS -- */}
        <div className="flex-1 grid grid-cols-2 gap-16 overflow-hidden min-h-0">
          
          {/* COLUMNA IZQUIERDA: CLIENTE + ÍTEMS */}
          <div className="flex flex-col space-y-10 overflow-hidden pr-4">
            
            {/* Cliente */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand shadow-sm">
                  <User className="w-4.5 h-4.5" />
                </div>
                <p className="text-[12px] font-bold font-outfit text-text-3 uppercase tracking-[0.15em]">Datos del Cliente</p>
              </div>

              <div className="space-y-4 relative">
                <input
                  value={newClientName}
                  onChange={(e) => {
                    setNewClientName(e.target.value);
                    setShowSuggestions(true);
                    if (cliente) onSelectPartner(null);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Escribe el nombre o razón social..."
                  className="w-full px-6 py-5 rounded-3xl bg-[#F8F9FA] border border-[#E2E8F0] text-[16px] text-text-1 font-medium placeholder:text-text-3 focus:outline-none focus:ring-8 focus:ring-brand/5 focus:border-brand/30 transition-all font-outfit"
                />
                {cliente && (
                   <button onClick={handleClearClient} className="absolute right-5 top-5 text-text-3 hover:text-brand transition-colors bg-white rounded-full p-1 shadow-sm">
                     <X className="w-4 h-4" />
                   </button>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] border border-[#E2E8F0] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full px-6 py-5 text-left hover:bg-brand/5 transition-colors border-b border-[#F1F5F9] last:border-0 group"
                      >
                        <div className="text-[15px] font-bold text-text-1 font-outfit group-hover:text-brand transition-colors">{p.name}</div>
                        <div className="text-[11px] text-text-3 font-medium uppercase tracking-wider mt-0.5">{p.rif || "Sin Identificación"}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={newClientRif}
                    onChange={(e) => setNewClientRif(e.target.value)}
                    placeholder="Cédula / RIF"
                    disabled={!!cliente}
                    className="w-full px-6 py-4 rounded-[24px] bg-[#F8F9FA] border border-[#E2E8F0] text-[15px] font-medium text-text-1 transition-all disabled:opacity-50 font-outfit outline-none focus:border-brand/30"
                  />
                  <input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Teléfono"
                    disabled={!!cliente}
                    className="w-full px-6 py-4 rounded-[24px] bg-[#F8F9FA] border border-[#E2E8F0] text-[15px] font-medium text-text-1 transition-all disabled:opacity-50 font-outfit outline-none focus:border-brand/30"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 flex flex-col space-y-5 overflow-hidden border-t border-[#F1F5F9] pt-8">
               <div className="flex items-center justify-between">
                 <p className="text-[12px] font-bold font-outfit text-text-3 uppercase tracking-[0.15em]">Productos Seleccionados</p>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-10 py-12">
                       <ShoppingBag className="w-12 h-12 mb-4" />
                       <span className="text-[13px] font-bold font-outfit uppercase tracking-widest">Carrito de venta listo</span>
                    </div>
                  ) : (
                    cart.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between group relative bg-[#F8F9FA]/60 p-5 rounded-[28px] border border-transparent hover:border-brand/10 hover:bg-white hover:shadow-xl hover:shadow-brand/5 transition-all">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[15px] font-bold text-text-1 truncate pr-10 font-outfit">{item.name}</span>
                          <span className="text-[12px] font-medium text-text-3 font-outfit mt-0.5">{item.qty} unidad(es) × ${Number(item.price_usd).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-5">
                           <span className="text-[18px] font-bold text-text-1 font-outfit tracking-tight">${(item.price_usd * item.qty).toFixed(2)}</span>
                           <button onClick={() => onRemove(item.id)} className="p-2.5 text-danger hover:bg-danger/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                              <Trash2 className="w-4.5 h-4.5" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PAGO + TOTALES + BOTONES */}
          <div className="flex flex-col space-y-10 overflow-hidden">
            
            {/* Condición */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand shadow-sm">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <p className="text-[12px] font-bold font-outfit text-text-3 uppercase tracking-[0.15em]">Modalidad de Pago</p>
              </div>

              <div className="flex gap-4">
                {["contado", "credito"].map((c) => (
                   <button
                    key={c}
                    onClick={() => onConditionChange(c as any)}
                    className={`flex-1 py-5 rounded-3xl border-2 font-bold text-[15px] font-outfit transition-all capitalize tracking-wide ${condition === c ? "bg-[#1A1125] text-white border-[#1A1125] shadow-xl" : "bg-white text-text-3 border-[#E2E8F0] hover:border-brand/30"}`}
                   >
                    {c === "contado" ? "Pago Inmediato" : "Crédito a Plazos"}
                   </button>
                ))}
              </div>

              {condition === "credito" && (
                <div className="relative animate-in slide-in-from-top-6 duration-500">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-brand font-outfit text-lg">$</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                    placeholder="Ingresa el monto de abono inicial"
                    className="w-full pl-12 pr-6 py-5 rounded-3xl border-2 border-brand/20 bg-brand/5 text-[18px] font-bold text-brand focus:outline-none focus:border-brand font-outfit placeholder:text-brand/40"
                  />
                </div>
              )}
            </div>

            {/* Métodos de Pago */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "efectivo", label: "Efectivo $" },
                { id: "zelle", label: "Zelle / Venmo" },
                { id: "transferencia", label: "Transferencia Bs." },
                { id: "pago_movil", label: "Pago Móvil" },
                { id: "punto", label: "Tarjeta de Débito" },
                { id: "otro", label: "Otro Método" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-4.5 px-4 rounded-[24px] border font-bold text-[13px] font-outfit transition-all uppercase tracking-tight
                    ${method === m.id ? "bg-brand text-white border-brand shadow-[0_10px_30px_rgba(224,64,251,0.2)]" : "bg-[#F8F9FA] text-text-3 border-[#E2E8F0] hover:bg-white hover:border-brand/40"}
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Pie de Página: Totales y Botones */}
            <div className="mt-auto space-y-8 pt-10 border-t border-[#F1F5F9]">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-2">
                   <span className="text-[13px] font-bold font-outfit text-text-3 uppercase tracking-[0.1em]">Monto Total de Venta</span>
                   <div className="flex items-center gap-2 bg-[#F8F9FA] px-4 py-2 rounded-xl border border-[#E2E8F0]">
                     <span className="text-[11px] font-bold text-text-3">Bs.</span>
                     <p className="font-mono text-[15px] font-bold text-[#1A1125] tracking-tight">{totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-bold text-brand font-outfit mb-3">$</span>
                     <span className="text-[64px] font-bold font-outfit text-[#1A1125] leading-none tracking-tighter">
                      {total.toFixed(2)}
                     </span>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={onSubmit}
                  disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
                  className={`
                    w-full py-6 rounded-[32px] font-bold text-[17px] font-outfit transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em]
                    ${
                      submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
                        ? "bg-[#F4F7FA] text-[#B0BCCB] cursor-not-allowed border border-[#E2E8F0]"
                        : "bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-[0_15px_45px_rgba(224,64,251,0.25)] hover:shadow-[0_20px_60px_rgba(224,64,251,0.4)] hover:-translate-y-1.5"
                    }
                  `}
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Confirmar Pago"
                  )}
                </button>

                <div className="grid grid-cols-2 gap-4">
                   <button className="py-5 rounded-[24px] font-bold text-[14px] font-outfit text-text-2 bg-white border border-[#E2E8F0] hover:bg-[#F8F9FA] transition-all uppercase tracking-widest text-center shadow-sm">
                     Ver Cotización
                   </button>
                   <button className="py-5 rounded-[24px] font-bold text-[14px] font-outfit text-danger bg-danger/5 border border-danger/10 hover:bg-danger/10 transition-all uppercase tracking-widest text-center">
                     Descartar Venta
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
