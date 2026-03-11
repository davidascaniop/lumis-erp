"use client";
import { useState, useMemo } from "react";
import { Search, Package, Check } from "lucide-react";

export function ProductoGrid({
  productos,
  cart,
  onAdd,
}: {
  productos: any[];
  cart: any[];
  onAdd: (p: any) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoria, setCat] = useState<string | null>(null);
  const [justAdded, setAdded] = useState<Set<string>>(new Set());

  // Categorías únicas
  const categorias = useMemo(
    () =>
      [
        ...new Set(productos.map((p: any) => p.category).filter(Boolean)),
      ].sort(),
    [productos],
  );

  // Filtrado
  const filtered = useMemo(() => {
    return productos.filter((p: any) => {
      const matchQ =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku?.toLowerCase().includes(query.toLowerCase());
      const matchC = !categoria || p.category === categoria;
      return matchQ && matchC;
    });
  }, [productos, query, categoria]);

  // Cantidad en carrito
  const cartQty = (id: string) => cart.find((i: any) => i.id === id)?.qty ?? 0;

  const handleAdd = (p: any) => {
    onAdd(p);
    setAdded((prev) => new Set([...prev, p.id]));
    setTimeout(
      () =>
        setAdded((prev) => {
          const n = new Set(prev);
          n.delete(p.id);
          return n;
        }),
      600,
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── BARRA DE BÚSQUEDA + FILTROS ── */}
      <div className="px-5 py-3 border-b border-white/5 flex-shrink-0 space-y-2.5">
        <div
          className="flex items-center gap-2.5 px-4 py-2.5
                                bg-[#18102A] border border-white/[0.06] rounded-xl
                                focus-within:border-[rgba(224,64,251,0.35)]
                                transition-all duration-200"
        >
          <Search className="w-3.5 h-3.5 text-[#3D2D5C] flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto o SKU..."
            className="bg-transparent text-sm text-white placeholder-[#3D2D5C]
                                   focus:outline-none flex-1"
          />
        </div>

        {/* Chips de categorías */}
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setCat(null)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0
                                       transition-all duration-150 ${
                                         !categoria
                                           ? "bg-[rgba(224,64,251,0.15)] text-[#E040FB] border border-[rgba(224,64,251,0.30)]"
                                           : "bg-white/[0.04] text-[#9585B8] border border-white/[0.06] hover:text-white"
                                       }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCat(cat === categoria ? null : cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0
                                           transition-all duration-150 ${
                                             categoria === cat
                                               ? "bg-[rgba(224,64,251,0.15)] text-[#E040FB] border border-[rgba(224,64,251,0.30)]"
                                               : "bg-white/[0.04] text-[#9585B8] border border-white/[0.06] hover:text-white"
                                           }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl bg-[rgba(224,64,251,0.06)]
                                        border border-[rgba(224,64,251,0.10)]
                                        flex items-center justify-center mb-4"
            >
              <Package className="w-7 h-7 text-[#3D2D5C]" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Sin resultados
            </p>
            <p className="text-xs text-[#9585B8]">
              Intenta con otro nombre o SKU
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtered.map((p: any) => {
              const qty = cartQty(p.id);
              const added = justAdded.has(p.id);
              const noStock =
                p.stock !== null && p.stock !== undefined && p.stock <= 0;

              return (
                <button
                  key={p.id}
                  onClick={() => !noStock && handleAdd(p)}
                  disabled={noStock}
                  className={`
                                        relative text-left p-4 rounded-2xl border transition-all duration-150
                                        ${
                                          noStock
                                            ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.04]"
                                            : qty > 0
                                              ? "bg-[rgba(224,64,251,0.08)] border-[rgba(224,64,251,0.25)] hover:bg-[rgba(224,64,251,0.12)]"
                                              : "bg-[#18102A] border-white/[0.06] hover:bg-[#1F1535] hover:border-[rgba(224,64,251,0.20)] hover:-translate-y-0.5"
                                        }
                                    `}
                >
                  {/* Badge cantidad en carrito */}
                  {qty > 0 && (
                    <div
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full
                                                        bg-[#E040FB] text-white text-[10px] font-bold
                                                        flex items-center justify-center z-10
                                                        shadow-[0_0_8px_rgba(224,64,251,0.60)]"
                    >
                      {qty}
                    </div>
                  )}

                  {/* Icono / Imagen */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 flex-shrink-0 ${
                      qty > 0 ? "bg-[rgba(224,64,251,0.15)]" : "bg-white/[0.06]"
                    }`}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Package
                        className={`w-5 h-5 ${qty > 0 ? "text-[#E040FB]" : "text-[#3D2D5C]"}`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  {p.category && (
                    <p className="text-[9px] font-bold text-[#E040FB] uppercase tracking-widest mb-0.5 truncate">
                      {p.category}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
                    {p.name}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-mono text-base font-bold text-white">
                      ${Number(p.price_usd).toFixed(2)}
                    </span>
                    {p.stock !== null && p.stock !== undefined && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          p.stock <= 5
                            ? "bg-[rgba(255,45,85,0.10)] text-[#FF2D55]"
                            : "bg-white/[0.06] text-[#9585B8]"
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    )}
                  </div>

                  {/* Overlay "Agregado" */}
                  {added && (
                    <div
                      className="absolute inset-0 rounded-2xl bg-[rgba(0,229,204,0.08)]
                                                        border border-[rgba(0,229,204,0.30)]
                                                        flex items-center justify-center pointer-events-none
                                                        animate-pulse"
                    >
                      <div className="flex items-center gap-1.5 text-[#00E5CC] text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> Agregado
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
