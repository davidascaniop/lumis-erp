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
      className="w-[340px] flex-shrink-0 flex flex-col bg-[#110B1A]
                        border-l border-white/5 overflow-hidden"
    >
      {/* ── HEADER ── */}
      <div className="px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#9585B8]" />
          <h2 className="text-sm font-bold text-white">Resumen del Pedido</h2>
          {cart.length > 0 && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full
                                         bg-[rgba(224,64,251,0.10)] text-[#E040FB]"
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
              className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5
                                        flex items-center justify-center mb-4"
            >
              <ShoppingCart className="w-7 h-7 text-[#3D2D5C]" />
            </div>
            <p className="text-sm font-semibold text-[#9585B8] mb-1">
              Carrito vacío
            </p>
            <p className="text-xs text-[#3D2D5C]">
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
                                            bg-[#18102A] border border-white/5
                                            hover:border-[rgba(224,64,251,0.12)] transition-all"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-[11px] text-[#9585B8] mt-0.5">
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
                    className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.10]
                                                   flex items-center justify-center transition-colors"
                  >
                    {item.qty === 1 ? (
                      <Trash2 className="w-3 h-3 text-[#FF2D55]" />
                    ) : (
                      <Minus className="w-3 h-3 text-[#9585B8]" />
                    )}
                  </button>
                  <span className="font-mono text-sm font-bold text-white w-5 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-[rgba(224,64,251,0.10)]
                                                   hover:bg-[rgba(224,64,251,0.20)] border border-[rgba(224,64,251,0.20)]
                                                   flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#E040FB]" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="w-14 text-right flex-shrink-0">
                  <p className="font-mono text-xs font-bold text-white">
                    ${(item.price_usd * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN INFERIOR: PAGO + TOTAL ── */}
      <div className="border-t border-white/5 flex-shrink-0 p-4 space-y-4">
        {/* Condición de pago */}
        <div>
          <p className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest mb-2">
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
                    ? "bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-[0_4px_12px_rgba(224,64,251,0.30)]"
                    : "bg-white/5 text-[#9585B8] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Método de cobro — visible siempre */}
        <div>
          <p className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest mb-2">
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
                                                ? "bg-[rgba(224,64,251,0.12)] border border-[rgba(224,64,251,0.30)] text-[#E040FB]"
                                                : "bg-white/[0.03] border border-white/5 text-[#9585B8] hover:bg-white/[0.06]"
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
            <p className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest">
              Abono Inicial ($)
            </p>
            <input
              type="number"
              value={amountPaid || ""}
              onChange={(e) => onAmountPaidChange(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-[#18102A] border border-white/[0.06]
                                       text-sm text-white placeholder-[#3D2D5C] font-mono
                                       focus:outline-none focus:border-[rgba(224,64,251,0.40)]
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
        <div className="h-px bg-white/5" />

        {/* Total */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#9585B8]">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Total</span>
            <div className="text-right">
              <p className="font-mono text-xl font-black text-white leading-tight">
                ${total.toFixed(2)}
              </p>
              {bcvRate > 0 && (
                <p className="font-mono text-[11px] text-[#9585B8]">
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
                            ? "bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-[0_8px_24px_rgba(224,64,251,0.30)] hover:shadow-[0_12px_32px_rgba(224,64,251,0.40)] hover:opacity-95 active:scale-[0.98]"
                            : "bg-white/[0.04] text-[#3D2D5C] cursor-not-allowed"
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
          <p className="text-[11px] text-[#3D2D5C] text-center -mt-1">
            Selecciona un cliente para continuar
          </p>
        )}
      </div>
    </div>
  );
}
