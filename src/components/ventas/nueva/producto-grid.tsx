"use client";
import { useState, useMemo } from "react";
import { Search, Package, Check, RotateCcw, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductoGrid({
  productos,
  cart,
  onAdd,
  categories,
}: {
  productos: any[];
  cart: any[];
  onAdd: (p: any, qty?: number) => void;
  categories: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoria, setCat] = useState<string | null>(null);
  const [justAdded, setAdded] = useState<Set<string>>(new Set());

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
    <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6 bg-[#F8FAFC]">
      
      {/* ── FILTROS Y BÚSQUEDA ── */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#EDF2F7] shadow-sm">
        <div className="flex-1 max-w-[200px] xl:max-w-[250px]">
          <select
            value={categoria || ""}
            onChange={(e) => setCat(e.target.value || null)}
            className="w-full px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-bold text-slate-700 focus:outline-none focus:border-brand/40 font-outfit appearance-none cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 xl:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
             <input
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Buscar..."
               className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium focus:outline-none focus:border-brand/30 font-outfit"
             />
          </div>
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS (2 Columnas) ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-40">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-sm font-bold font-outfit uppercase">Sin resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
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
  const noStock = product.stock <= 0;

  return (
    <div className={`bg-white rounded-2xl p-4 border border-[#EDF2F7] shadow-sm hover:shadow-md transition-all flex flex-col gap-4 ${noStock ? 'opacity-50' : ''}`}>
       <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl bg-[#F8FAFC] flex items-center justify-center overflow-hidden border border-[#F1F5F9] flex-shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
            ) : (
              <Package className="w-10 h-10 text-text-3 opacity-20" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 py-1">
            <h3 className="text-[15px] font-bold text-[#1A1125] font-outfit line-clamp-2 mb-0.5 leading-tight" title={product.name}>{product.name}</h3>
            <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide mb-2">
               {product.category || "General"}
            </p>
            <p className="text-xl font-bold text-brand font-outfit mb-2">$ {Number(product.price_usd).toFixed(2)}</p>
            <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-text-3 uppercase font-outfit tracking-wide">SKU: {product.sku || 'N/A'}</p>
               <p className="text-[10px] font-bold text-text-3 uppercase font-outfit tracking-wide">Existencia: <span className="text-text-1">{product.stock} {product.unit || 'Uni'}</span></p>
            </div>
          </div>
       </div>

       <div className="flex items-center gap-3 mt-auto">
          <div className="flex items-center bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-1 flex-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-text-3 hover:text-[#1A1125] transition-colors"><Minus className="w-3.5 h-3.5"/></button>
            <span className="flex-1 text-center text-sm font-bold font-outfit text-[#1A1125]">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-text-3 hover:text-[#1A1125] transition-colors"><Plus className="w-3.5 h-3.5"/></button>
          </div>
          
          <button
            onClick={() => onAdd(qty)}
            disabled={noStock}
            className={`h-10 px-6 rounded-lg font-bold font-outfit text-xs uppercase tracking-widest transition-all ${
              justAdded ? 'bg-status-ok text-white' : 'bg-brand text-white hover:opacity-90 active:scale-95 shadow-lg shadow-brand/10'
            }`}
          >
            {justAdded ? <div className="flex items-center gap-1"><Check className="w-4 h-4"/> OK</div> : "Agregar"}
          </button>
       </div>
    </div>
  );
}
