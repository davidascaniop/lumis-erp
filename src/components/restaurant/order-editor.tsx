"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Trash2, Send, CreditCard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderEditorProps {
  products: any[];
  categories: string[];
  items: any[];
  onAddItem: (product: any, modifications?: string) => void;
  onUpdateItemQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSendToKitchen: () => void;
  onRequestBill: () => void;
  tableName: string;
  guestsCount: number;
  waiterName: string;
  canSendToKitchen: boolean;
  isSending: boolean;
}

export function OrderEditor({
  products,
  categories,
  items,
  onAddItem,
  onUpdateItemQty,
  onRemoveItem,
  onSendToKitchen,
  onRequestBill,
  tableName,
  guestsCount,
  waiterName,
  canSendToKitchen,
  isSending,
}: OrderEditorProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [modificationInput, setModificationInput] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== "Todos") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategory, search]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items]
  );

  const pendingItems = items.filter((i) => i.status === "pendiente");
  const sentItems = items.filter((i) => i.status !== "pendiente");

  return (
    <div className="flex h-full gap-4">
      {/* LEFT: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-card rounded-2xl border border-border">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-input border border-border/40 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-border">
          {["Todos", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-brand text-white"
                  : "bg-surface-base text-text-3 hover:text-text-1 border border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                const mods = modificationInput[product.id] || "";
                onAddItem(product, mods);
                setModificationInput((prev) => ({ ...prev, [product.id]: "" }));
              }}
              className="group p-4 rounded-xl bg-surface-base border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left active:scale-[0.97]"
            >
              <p className="text-sm font-bold text-text-1 truncate">{product.name}</p>
              <p className="text-xs text-brand font-bold mt-1">${Number(product.price_usd || 0).toFixed(2)}</p>
              <input
                placeholder="Modificaciones..."
                value={modificationInput[product.id] || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  setModificationInput((prev) => ({ ...prev, [product.id]: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 w-full px-2 py-1 rounded-md bg-surface-input border border-border/30 text-[10px] text-text-2 focus:outline-none focus:ring-1 focus:ring-brand/30 placeholder:text-text-3/50"
              />
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-text-3 text-sm py-8">No hay productos</p>
          )}
        </div>
      </div>

      {/* RIGHT: Active Order */}
      <div className="w-[380px] flex flex-col bg-surface-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-brand/5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-text-1 font-montserrat">{tableName}</h3>
            <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20">
              {guestsCount} comensales
            </span>
          </div>
          <p className="text-xs text-text-3">Mesero: <span className="font-semibold text-text-2">{waiterName}</span></p>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sentItems.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-2 px-1">Enviados a cocina</p>
              {sentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-1 truncate">{item.product_name}</p>
                    {item.modifications && (
                      <p className="text-[10px] text-amber-600 italic truncate mt-0.5">→ {item.modifications}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-text-2 shrink-0">x{item.quantity}</span>
                  <span className="text-xs font-bold text-text-1 shrink-0">${(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {pendingItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-2 px-1">Pendientes de envío</p>
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-base border border-border mb-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-1 truncate">{item.product_name}</p>
                    {item.modifications && (
                      <p className="text-[10px] text-amber-600 italic truncate mt-0.5">→ {item.modifications}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateItemQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateItemQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-text-1 shrink-0 w-14 text-right">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-10 text-text-3">
              <p className="text-sm font-medium">Comanda vacía</p>
              <p className="text-xs mt-1">Toca un producto para agregarlo</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-2">Total</span>
            <span className="text-xl font-black text-text-1 font-montserrat">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={onSendToKitchen}
            disabled={!canSendToKitchen || isSending}
            className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar a Cocina
          </button>

          <button
            onClick={onRequestBill}
            className="w-full py-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold text-sm hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pedir Cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
