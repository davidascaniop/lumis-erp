"use client";
import { useState, useMemo } from "react";
import { Search, Package, Check, RotateCcw, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductoGrid({
  productos,
  cart,
  onAdd,
}: {
  productos: any[];
  cart: any[];
  onAdd: (p: any, qty?: number) => void;
}) {
  const router = useRouter();
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

  const handleAdd = (p: any, qty: number = 1) => {
    onAdd(p, qty);
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
    <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
      {/* ── BARRA DE BÚSQUEDA + FILTROS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filtros a la izquierda */}
        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-2xl border border-white flex-shrink-0">
          <button
            onClick={() => setCat(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              !categoria
                ? "bg-white text-text-1 shadow-sm"
                : "text-text-3 hover:text-text-1"
            }`}
          >
            Todos
          </button>
          {categorias.slice(0, 3).map((cat) => (
            <button
              key={cat}
              onClick={() => setCat(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                categoria === cat
                  ? "bg-white text-text-1 shadow-sm"
                  : "text-text-3 hover:text-text-1"
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-text-3 hover:text-text-1 text-sm font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Regresar
          </button>
        </div>

        {/* Buscador a la derecha */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-11 pr-24 py-3 bg-white border border-white rounded-2xl 
                       text-sm text-text-1 placeholder:text-text-3
                       focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/20
                       transition-all shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-lg shadow-brand/20">
              Pills 9
            </span>
            <span className="px-3 py-1 bg-white border text-text-2 text-[10px] font-bold rounded-lg shadow-sm">
              Rescompaño 3
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-3xl bg-white border border-white flex items-center justify-center mb-4 shadow-sm">
              <Package className="w-7 h-7 text-text-3" />
            </div>
            <p className="text-sm font-bold text-text-1">Sin resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 pb-6">
            {filtered.map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={(qty) => handleAdd(p, qty)}
                justAdded={justAdded.has(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  justAdded,
}: {
  product: any;
  onAdd: (qty: number) => void;
  justAdded: boolean;
}) {
  const [qty, setQty] = useState(1);
  const noStock =
    product.stock !== null && product.stock !== undefined && product.stock <= 0;

  return (
    <div
      className={`
        bg-white rounded-[32px] p-6 border border-white shadow-sm flex flex-col gap-4
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group
        ${noStock ? "opacity-60 cursor-not-allowed" : ""}
      `}
    >
      <div className="flex gap-5">
        {/* Imagen */}
        {product.image_url && (
          <div className="w-24 h-24 rounded-2xl bg-[#F8F9FE] flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#3F3F44] line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-2xl font-black text-brand tracking-tight mb-2">
            ${Number(product.price_usd).toFixed(2)}
          </p>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">
              SKU: {product.sku || "N/A"}
            </p>
            <p className="text-[10px] font-bold text-text-3">
              Existencia:{" "}
              <span className="text-text-2 font-black">
                {product.stock} {product.unit || "Uni"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center gap-3 mt-auto">
        <div className="flex items-center bg-[#F8F9FE] rounded-xl p-1 border border-[#EDF0F7] flex-1">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-8 h-8 flex items-center justify-center text-text-3 hover:text-text-1 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="flex-1 text-center font-bold text-sm text-text-1">
            {qty}
          </span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-8 h-8 flex items-center justify-center text-text-3 hover:text-text-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onAdd(qty)}
          disabled={noStock}
          className={`
            px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95
            ${
              justAdded
                ? "bg-status-ok text-white"
                : "bg-brand text-white shadow-brand/20 hover:opacity-90"
            }
          `}
        >
          {justAdded ? (
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" /> Agregado
            </div>
          ) : (
            "Agregar"
          )}
        </button>
      </div>
    </div>
  );
}
