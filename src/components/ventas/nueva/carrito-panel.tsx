"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  UserPlus,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  // New Client Props
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
    <div
      className="w-[360px] flex-shrink-0 flex flex-col bg-white
                        border-l border-border overflow-hidden shadow-2xl z-10"
    >
      {/* ── HEADER ── */}
      <div className="px-6 py-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#3F3F44]">
            Resumen del Pedido
          </h2>
          {cart.length > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand/10 text-brand">
              {cart.length} ítem{cart.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-6 space-y-6">
        {/* ── SECCIÓN CLIENTE ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            {cliente ? "Cliente Seleccionado" : "Nuevo Cliente"}
          </p>

          <div className="space-y-2.5">
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
                className={`
                  w-full px-4 py-3 rounded-2xl bg-[#F8F9FE] border border-[#EDF0F7]
                  text-sm text-text-1 placeholder:text-text-3 font-semibold
                  focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/35
                  transition-all
                  ${cliente ? "border-brand/40 bg-brand/5" : ""}
                `}
              />
              {cliente && (
                <button
                  onClick={handleClearClient}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand hover:text-brand/80"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-2xl z-[100] overflow-hidden">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectSuggestion(p)}
                      className="w-full px-4 py-3 text-left hover:bg-brand/5 transition-colors border-b border-border last:border-0 flex flex-col"
                    >
                      <span className="text-sm font-bold text-text-1">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-text-3">
                        {p.rif || "Sin RIF"}
                      </span>
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
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FE] border border-[#EDF0F7]
                         text-sm text-text-1 placeholder:text-text-3 font-semibold
                         focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/35
                         transition-all disabled:opacity-70"
            />
            <input
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Teléfono"
              disabled={!!cliente}
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FE] border border-[#EDF0F7]
                         text-sm text-text-1 placeholder:text-text-3 font-semibold
                         focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/35
                         transition-all disabled:opacity-70"
            />
          </div>
        </div>

        {/* ── CONDICIÓN ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Condición
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => onConditionChange("contado")}
              className="flex items-center gap-3 group"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  condition === "contado"
                    ? "border-brand bg-brand"
                    : "border-[#EDF0F7]"
                }`}
              >
                {condition === "contado" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span
                className={`text-sm font-bold ${condition === "contado" ? "text-text-1" : "text-text-3"}`}
              >
                Contado
              </span>
            </button>
            <button
              onClick={() => onConditionChange("credito")}
              className="flex items-center gap-3 group"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  condition === "credito"
                    ? "border-brand bg-brand"
                    : "border-[#EDF0F7]"
                }`}
              >
                {condition === "credito" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span
                className={`text-sm font-bold ${condition === "credito" ? "text-text-1" : "text-text-3"}`}
              >
                Crédito
              </span>
            </button>
          </div>
        </div>

        {/* ── LÍNEAS DEL CARRITO ── */}
        <div className="flex-1 space-y-4">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
            Ítems del Pedido
          </p>
          {cart.length === 0 ? (
            <div className="bg-[#F8F9FE] rounded-2xl p-6 border-2 border-dashed border-[#EDF0F7] text-center">
              <ShoppingCart className="w-6 h-6 text-text-3 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-text-3">Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center">
                      <Package className="w-3 h-3 text-text-3" />
                    </div>
                    <span className="text-xs font-bold text-[#3F3F44] truncate max-w-[140px]">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-text-3 font-semibold">
                      ({item.qty}x ${Number(item.price_usd).toFixed(2)})
                    </span>
                  </div>
                  <span className="text-xs font-black text-text-1 font-mono">
                    ${(item.price_usd * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TOTALES Y BOTONES ── */}
      <div className="px-6 py-8 bg-[#F4F4F9]/30 border-t border-[#EDF0F7] space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#3F3F44]">Total:</h3>
            <p className="font-mono text-[11px] text-text-3 font-semibold">
              Bs. {totalBs.toLocaleString("es-VE", {
                maximumFractionDigits: 2,
              })} (Tasa Bcv: {bcvRate.toFixed(2)})
            </p>
          </div>
          <p className="font-mono text-4xl font-black text-brand tracking-tighter">
            ${total.toFixed(2)}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onSubmit}
            disabled={
              submitting ||
              cart.length === 0 ||
              (!cliente && (!newClientName || !newClientRif))
            }
            className={`
              w-full py-5 rounded-[24px] font-black text-sm transition-all duration-300
              shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest
              ${
                submitting || cart.length === 0 || (!cliente && (!newClientName || !newClientRif))
                  ? "bg-[#EDF0F7] text-text-3 cursor-not-allowed"
                  : "bg-brand-gradient text-white shadow-brand/30 hover:shadow-brand/50"
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
              </>
            ) : (
              "Finalizar Pedido"
            )}
          </button>

          <button className="w-full py-4 rounded-[24px] font-bold text-xs text-text-3 border border-[#EDF0F7] hover:bg-white hover:text-text-1 transition-all uppercase tracking-widest">
            Cotizar
          </button>
          <button className="w-full py-4 rounded-[24px] font-bold text-xs text-text-3 border border-transparent hover:text-status-danger transition-all uppercase tracking-widest">
            Cancelar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function Package({ className }: { className: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.21 12 2l4.5 2.21" />
      <path d="m7.5 4.21 4.5 2.21v5.08" />
      <path d="m16.5 4.21-4.5 2.21v5.08" />
      <path d="m7.5 9.29 4.5 2.21 4.5-2.21" />
      <path d="M3.29 7 12 11.35 20.71 7" />
      <path d="M12 22V11.35" />
      <path d="M3.29 17 12 21.35 20.71 17" />
      <path d="M3.29 7v10" />
      <path d="M20.71 7v10" />
    </svg>
  );
}
