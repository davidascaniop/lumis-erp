"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Trash2, Send, CreditCard, Search, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderEditorProps {
  products: any[];
  categories: string[];
  items: any[];
  onAddItem: (product: any, modifications?: string) => void;
  onUpdateItemQty: (itemId: string, delta: number) => void;
  onUpdateItemNote?: (itemId: string, note: string) => void;
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
  onUpdateItemNote,
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
  const [editingNoteFor, setEditingNoteFor] = useState<{ id: string; note: string } | null>(null);

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
                onAddItem(product);
              }}
              className="group p-4 rounded-xl bg-surface-base border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left active:scale-[0.97]"
            >
              <p className="text-sm font-bold text-text-1 truncate">{product.name}</p>
              <p className="text-xs text-brand font-bold mt-1">${Number(product.price_usd || 0).toFixed(2)}</p>
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
                  {onUpdateItemNote && (
                    <button
                      onClick={() => setEditingNoteFor({ id: item.id, note: item.modifications || "" })}
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
                      title="Añadir nota"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

      {/* Edit Note Modal */}
      {editingNoteFor && onUpdateItemNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingNoteFor(null)} />
          <div className="relative w-full max-w-sm bg-surface-card rounded-3xl p-6 shadow-elevated border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-1 font-montserrat">Añadir Nota</h2>
              <button onClick={() => setEditingNoteFor(null)} className="p-2 rounded-xl hover:bg-surface-hover transition-colors">
                <X className="w-5 h-5 text-text-3" />
              </button>
            </div>
            
            <p className="text-xs text-text-3 mb-4">Escribe excepciones, extras o modificaciones para la preparación en cocina.</p>
            
            <textarea
              autoFocus
              value={editingNoteFor.note}
              onChange={(e) => setEditingNoteFor({ ...editingNoteFor, note: e.target.value })}
              placeholder="Ej. Sin cebolla, Extra queso, Término 3/4..."
              className="w-full h-24 p-4 rounded-xl bg-surface-input border border-border/40 text-text-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none mb-6"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onUpdateItemNote(editingNoteFor.id, editingNoteFor.note);
                  setEditingNoteFor(null);
                }
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingNoteFor(null)}
                className="flex-1 py-3 rounded-xl border border-border text-text-2 font-bold hover:bg-surface-hover transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateItemNote(editingNoteFor.id, editingNoteFor.note);
                  setEditingNoteFor(null);
                }}
                className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
