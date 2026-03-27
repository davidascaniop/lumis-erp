"use client";
import { Minus, Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";

const METODOS = [
  { id: "Zelle", emoji: "💵", label: "Zelle" },
  { id: "Pago Móvil", emoji: "📱", label: "Pago Móvil" },
  { id: "Efectivo", emoji: "💴", label: "Efectivo $" },
  { id: "Punto de Venta", emoji: "💳", label: "Punto" },
  { id: "Transferencia", emoji: "🏦", label: "Transf." },
  { id: "Otro", emoji: "🔄", label: "Otro" },
];

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
}) {
  const total = subtotal;
  const totalBs = total * bcvRate;

  return (
    <div
      className="w-[340px] flex-shrink-0 flex flex-col bg-surface-elevated
                        border-l border-border overflow-hidden"
    >
      {/* ── HEADER ── */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-text-3" />
          <h2 className="text-sm font-bold text-text-1">Resumen del Pedido</h2>
          {cart.length > 0 && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full
                                         bg-brand/10 text-brand"
            >
              {cart.length} ítem{cart.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── LÍNEAS DEL CARRITO ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl bg-surface-base border border-border
                                        flex items-center justify-center mb-4"
            >
              <ShoppingCart className="w-7 h-7 text-text-3" />
            </div>
            <p className="text-sm font-semibold text-text-2 mb-1">
              Carrito vacío
            </p>
            <p className="text-xs text-text-3">
              Toca un producto para
              <br />
              agregarlo al pedido
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {cart.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl
                                            bg-surface-card border border-border
                                            hover:border-brand/20 transition-all"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-1 truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-[11px] text-text-3 mt-0.5">
                    ${Number(item.price_usd).toFixed(2)} / {item.unit ?? "und"}
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      item.qty === 1
                        ? onRemove(item.id)
                        : onUpdateQty(item.id, -1)
                    }
                    className="w-6 h-6 rounded-lg bg-surface-base hover:bg-surface-hover
                                                   flex items-center justify-center transition-colors"
                  >
                    {item.qty === 1 ? (
                      <Trash2 className="w-3 h-3 text-status-danger" />
                    ) : (
                      <Minus className="w-3 h-3 text-text-3" />
                    )}
                  </button>
                  <span className="font-mono text-sm font-bold text-text-1 w-5 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-brand/10
                                                   hover:bg-brand/20 border border-brand/20
                                                   flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3 text-brand" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="w-14 text-right flex-shrink-0">
                  <p className="font-mono text-xs font-bold text-text-1">
                    ${(item.price_usd * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN INFERIOR: PAGO + TOTAL ── */}
      <div className="border-t border-border flex-shrink-0 p-4 space-y-4">
        {/* Condición de pago */}
        <div>
          <p className="text-[10px] font-semibold text-text-3 uppercase tracking-widest mb-2">
            Condición
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "contado" as const, label: "Contado" },
              { id: "credito" as const, label: "Crédito" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onConditionChange(opt.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  condition === opt.id
                    ? "bg-brand-gradient text-white shadow-brand/20"
                    : "bg-surface-base text-text-3 hover:bg-surface-hover hover:text-text-1 border border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Método de cobro — visible siempre */}
        <div>
          <p className="text-[10px] font-semibold text-text-3 uppercase tracking-widest mb-2">
            Método de Cobro
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map((m) => (
              <button
                key={m.id}
                onClick={() => onMethodChange(m.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl
                                            text-center transition-all duration-150 ${
                                              method === m.id
                                                ? "bg-brand/10 border border-brand/30 text-brand"
                                                : "bg-surface-base border border-border text-text-3 hover:bg-surface-hover"
                                            }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Abono inicial si es a crédito */}
        {condition === "credito" && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
              Abono Inicial ($)
            </p>
            <input
              type="number"
              value={amountPaid || ""}
              onChange={(e) => onAmountPaidChange(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border
                                       text-sm text-text-1 placeholder:text-text-3 font-mono
                                       focus:outline-none focus:border-brand/40
                                       transition-all"
            />
            {total > 0 && (
              <p className="text-[10px] text-[#FFB800]">
                Restante:{" "}
                <span className="font-mono font-bold">
                  ${(total - amountPaid).toFixed(2)}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Total */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-3">
            <span>Subtotal</span>
            <span className="font-mono text-text-1">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-text-1">Total</span>
            <div className="text-right">
              <p className="font-mono text-xl font-black text-text-1 leading-tight">
                ${total.toFixed(2)}
              </p>
              {bcvRate > 0 && (
                <p className="font-mono text-[11px] text-text-3 font-semibold">
                  Bs.{" "}
                  {totalBs.toLocaleString("es-VE", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botón finalizar */}
        <button
          onClick={onSubmit}
          disabled={submitting || cart.length === 0 || !cliente}
          className={`
                        w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
                        flex items-center justify-center gap-2
                        ${
                          cart.length > 0 && cliente && !submitting
                            ? "bg-brand-gradient text-white shadow-brand/20 hover:opacity-95 active:scale-[0.98]"
                            : "bg-surface-base text-text-3 border border-border cursor-not-allowed"
                        }
                    `}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
            </>
          ) : (
            <>Finalizar Pedido {cart.length > 0 && `· $${total.toFixed(2)}`}</>
          )}
        </button>

        {/* Hint si falta algo */}
        {!cliente && (
          <p className="text-[11px] text-text-3 text-center -mt-1">
            Selecciona un cliente para continuar
          </p>
        )}
      </div>
    </div>
  );
}
