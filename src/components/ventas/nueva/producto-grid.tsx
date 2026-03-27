"use client";
import { useState, useMemo } from "react";
import { Search, Package, Check, RotateCcw, Plus, Minus, Tag } from "lucide-react";
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
    <div className="flex-1 flex flex-col overflow-hidden p-6 xl:p-8 space-y-6 xl:space-y-8 bg-white/50 backdrop-blur-md">
      
      {/* ── BARRA DE BÚSQUEDA + FILTROS ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Buscador a la izquierda (Prioridad Visual) */}
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-3 group-focus-within:text-brand transition-all" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca o SKU..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-[#E2E8F0] rounded-[24px] 
                       text-[15px] text-text-1 font-medium placeholder:text-text-3
                       focus:outline-none focus:ring-8 focus:ring-brand/5 focus:border-brand/30
                       shadow-sm transition-all font-outfit"
          />
        </div>

        {/* Filtros rápidos con Outfit */}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setCat(null)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all border font-outfit tracking-wide uppercase ${
              !categoria
                ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                : "bg-white text-text-3 border-[#E2E8F0] hover:border-brand/30"
            }`}
          >
            Todos
          </button>
          {categorias.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setCat(cat)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all border font-outfit tracking-wide uppercase ${
                categoria === cat
                  ? "bg-[#1A1125] text-white border-[#1A1125] shadow-lg shadow-black/10"
                  : "bg-white text-text-3 border-[#E2E8F0] hover:border-brand/30"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-[#E2E8F0] mx-2 hidden xl:block"></div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-text-3 hover:text-brand text-[13px] font-bold font-outfit uppercase tracking-wider transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Historial
          </button>
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS (Outfit Bold & Modern) ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F8F9FA] flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-text-3 opacity-30" />
            </div>
            <p className="text-[16px] font-bold text-text-2 font-outfit">No encontramos productos con ese criterio</p>
            <button onClick={() => { setQuery(""); setCat(null); }} className="mt-4 text-brand font-bold text-sm font-outfit underline underline-offset-4">Limpiar búsqueda</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 xl:gap-8 pb-10 stagger">
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
        bg-white rounded-[40px] p-8 border border-[#F1F5F9] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-6
        transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 group
        relative overflow-hidden
        ${noStock ? "opacity-60 cursor-not-allowed grayscale" : ""}
      `}
    >
      {/* Decoración sutil de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 group-hover:bg-brand/10 transition-colors duration-500"></div>

      <div className="flex gap-6 relative z-10">
        {/* Imagen / Placeholder con diseño */}
        <div className="w-28 h-28 rounded-3xl bg-[#F8F9FA] border border-[#F1F5F9] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
             <Package className="w-10 h-10 text-text-3 opacity-20" />
          )}
        </div>

        {/* Info de Producto */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-bold text-brand uppercase tracking-[0.15em] font-outfit">{product.category || "General"}</span>
          </div>
          <h3 className="text-lg font-bold text-[#1A1125] line-clamp-2 leading-snug mb-2 font-outfit group-hover:text-brand transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-[16px] font-bold text-brand font-outfit mb-1">$</span>
            <span className="text-3xl font-bold text-[#1A1125] tracking-tighter font-outfit leading-none">
              {Number(product.price_usd).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold font-outfit text-text-3 uppercase tracking-wider px-2">
           <span>Existencia Activa</span>
           <span className={`${product.stock < 10 ? "text-danger" : "text-text-2"}`}>{product.stock} {product.unit || "Uni"}</span>
        </div>
        
        {/* Footer / Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F8F9FA] rounded-[20px] p-1.5 border border-[#E2E8F0] flex-1 shadow-inner">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-10 h-10 flex items-center justify-center text-text-3 hover:text-brand hover:bg-white rounded-full transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-bold text-[16px] text-[#1A1125] font-outfit">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-10 h-10 flex items-center justify-center text-text-3 hover:text-brand hover:bg-white rounded-full transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onAdd(qty)}
            disabled={noStock}
            className={`
              h-14 px-8 rounded-[24px] font-bold text-[14px] font-outfit transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95
              ${
                justAdded
                  ? "bg-[#00C853] text-white shadow-lg shadow-green-500/20"
                  : "bg-[#1A1125] text-white shadow-xl shadow-black/10 hover:bg-brand hover:shadow-brand/20"
              }
            `}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" /> OK
              </>
            ) : (
              "Añadir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
