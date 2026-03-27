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
      <div className="flex-1 bg-white shadow-brand-lg rounded-[40px] border border-border flex flex-col overflow-hidden p-6 xl:p-8 space-y-6">
        
        {/* -- ENCABEZADO -- */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-black font-syne text-[#1A1125] tracking-tight">
            Resumen del Pedido
          </h2>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/5 text-brand border border-brand/10">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-black">{cart.length} Ítems</span>
          </div>
        </div>

        {/* -- CONTENIDO EN DOS COLUMNAS (Para evitar Scroll) -- */}
        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden min-h-0">
          
          {/* COLUMNA IZQUIERDA: CLIENTE + ÍTEMS */}
          <div className="flex flex-col space-y-6 overflow-hidden border-r border-border pr-6">
            
            {/* Cliente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand">
                <User className="w-4 h-4" />
                <p className="text-[11px] font-black uppercase tracking-widest">{cliente ? "Cliente Registrado" : "Nuevo Cliente"}</p>
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
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border border-border text-[14px] text-text-1 font-bold placeholder:text-text-3 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/40 transition-all"
                />
                {cliente && (
                   <button onClick={handleClearClient} className="absolute right-3 top-3 text-text-3 hover:text-brand transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-brand/20 shadow-brand-lg z-[100] overflow-hidden stagger">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full px-4 py-3 text-left hover:bg-brand/5 transition-colors border-b border-border last:border-0"
                      >
                        <div className="text-[14px] font-black text-text-1">{p.name}</div>
                        <div className="text-[11px] text-text-3 font-bold">{p.rif || "Sin RIF"}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newClientRif}
                    onChange={(e) => setNewClientRif(e.target.value)}
                    placeholder="Cédula / RIF"
                    disabled={!!cliente}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border border-border text-[13px] font-bold text-text-1 transition-all disabled:opacity-50"
                  />
                  <input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Teléfono"
                    disabled={!!cliente}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border border-border text-[13px] font-bold text-text-1 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Ítems (Ocupa el resto de la columna) */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden border-t border-dashed border-border pt-4">
               <p className="text-[11px] font-black text-text-3 uppercase tracking-widest">Detalle del Carrito</p>
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                       <ShoppingBag className="w-8 h-8 mb-2" />
                       <span className="text-xs font-bold">Carrito Vacío</span>
                    </div>
                  ) : (
                    cart.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between group relative bg-[#F8F9FA]/50 p-2.5 rounded-2xl border border-transparent hover:border-brand/20 transition-all">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-black text-text-1 truncate pr-6">{item.name}</span>
                          <span className="text-[11px] font-bold text-text-3">{item.qty}x ${Number(item.price_usd).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="font-mono text-[14px] font-black text-text-1">${(item.price_usd * item.qty).toFixed(2)}</span>
                           <button onClick={() => onRemove(item.id)} className="p-1.5 text-danger bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PAGO + TOTALES + BOTONES */}
          <div className="flex flex-col space-y-6 overflow-hidden">
            
            {/* Condición */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand">
                <CreditCard className="w-4 h-4" />
                <p className="text-[11px] font-black uppercase tracking-widest">Condición y Cobro</p>
              </div>

              <div className="flex gap-4">
                {["contado", "credito"].map((c) => (
                   <button
                    key={c}
                    onClick={() => onConditionChange(c as any)}
                    className={`flex-1 py-3 rounded-2xl border-2 font-black text-[13px] transition-all capitalize ${condition === c ? "bg-brand text-white border-brand shadow-brand" : "bg-white text-text-3 border-border hover:border-brand/30"}`}
                   >
                    {c}
                   </button>
                ))}
              </div>

              {condition === "credito" && (
                <div className="relative animate-in slide-in-from-top-2 duration-300">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-brand">$</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                    placeholder="Monto Abonado"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-brand/20 bg-brand/5 text-[15px] font-black text-brand focus:outline-none focus:border-brand"
                  />
                </div>
              )}
            </div>

            {/* Métodos de Pago */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "efectivo", label: "Efectivo $" },
                { id: "zelle", label: "Zelle" },
                { id: "transferencia", label: "Transferencia" },
                { id: "pago_movil", label: "Pago Móvil" },
                { id: "punto", label: "Punto Venta" },
                { id: "otro", label: "Otro" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-3 px-2 rounded-2xl border font-bold text-[11px] transition-all uppercase tracking-tighter
                    ${method === m.id ? "bg-text-1 text-white border-text-1 shadow-lg" : "bg-[#F8F9FA] text-text-3 border-border hover:bg-white hover:border-brand/40"}
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Pie de Página: Totales y Botones (Fijos al final) */}
            <div className="mt-auto space-y-6 pt-6 border-t border-border">
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                   <span className="text-[12px] font-black text-text-3 uppercase tracking-tighter">Total a Cobrar</span>
                   <p className="font-mono text-[13px] font-bold text-text-2">Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="font-syne text-[42px] font-black text-brand leading-none tracking-tighter animate-in zoom-in-75 duration-500">
                    ${total.toFixed(2)}
                   </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onSubmit}
                  disabled={submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))}
                  className={`
                    w-full py-5 rounded-[24px] font-black text-sm transition-all shadow-brand-lg active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest
                    ${
                      submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
                        ? "bg-[#EDF0F7] text-text-3 opacity-60 cursor-not-allowed"
                        : "bg-brand-gradient text-white hover:shadow-brand hover:-translate-y-1"
                    }
                  `}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "PROCESAR VENTA"
                  )}
                </button>

                <div className="grid grid-cols-2 gap-3">
                   <button className="py-4 rounded-[20px] font-black text-[12px] text-text-2 bg-white border border-border hover:bg-[#F8F9FA] transition-all tracking-widest">
                     COTIZAR
                   </button>
                   <button className="py-4 rounded-[20px] font-black text-[12px] text-danger bg-danger/5 border border-danger/10 hover:bg-danger/10 transition-all tracking-widest">
                     CANCELAR
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
