"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Package,
  MoreVertical,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Tag,
  Layers,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductForm } from "@/components/products/product-form";
import { toast } from "sonner";

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const supabase = createClient();

  const fetchProducts = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from("users")
      .select("company_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", userData.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar inventario");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => (p.stock || p.stock_qty) <= 5).length,
    inventoryValue: products.reduce(
      (acc, p) =>
        acc + Number(p.price_usd) * Number(p.stock || p.stock_qty || 0),
      0,
    ),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <ProductForm
        open={openAdd}
        setOpen={setOpenAdd}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts();
          setSelectedProduct(null);
        }}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary">
            Inventario Global
          </h1>
          <p className="text-text-3 font-medium">
            Gestiona tu catálogo, precios y existencias.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setOpenAdd(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Total Items
            </p>
            <p className="text-2xl font-primary text-white">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Stock Crítico
            </p>
            <p className="text-2xl font-primary text-white">{stats.lowStock}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-status-ok/10 flex items-center justify-center text-status-ok">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Valor Estimado
            </p>
            <p className="text-2xl font-primary text-white">
              ${stats.inventoryValue.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-3" />
          <Input
            placeholder="Buscar por nombre, SKU o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-surface-card border-border h-12 rounded-xl focus:ring-brand/30"
          />
        </div>
        <button className="p-3 bg-surface-card border border-border rounded-xl text-text-3 hover:text-white transition-all">
          <Filter className="w-6 h-6" />
        </button>
      </div>

      {/* PRODUCTS GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
          <p className="text-text-3 animate-pulse">
            Sincronizando existencias...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-surface-card/50 border-2 border-dashed border-border rounded-3xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-text-3 opacity-20" />
          </div>
          <h3 className="text-xl font-syne font-bold text-white mb-2">
            No se encontraron productos
          </h3>
          <p className="text-text-3 max-w-sm mx-auto mb-6">
            Parece que aún no tienes productos registrados o no coinciden con tu
            búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setOpenAdd(true);
            }}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Registrar mi primer producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const stock = p.stock || p.stock_qty || 0;
            const isLow = stock <= 5;

            return (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedProduct(p);
                  setOpenAdd(true);
                }}
              >
                <Card className="bg-surface-card border-border overflow-hidden hover:border-brand/40 hover:shadow-glow transition-all duration-300">
                  <div className="h-40 bg-surface-base flex items-center justify-center relative group-hover:bg-brand/5 transition-colors">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-text-3 opacity-20 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                      <p className="text-[10px] font-mono font-bold text-white tracking-widest">
                        {p.sku || "S/N"}
                      </p>
                    </div>
                    {isLow && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-status-danger/20 text-status-danger rounded-md border border-status-danger/30 text-[10px] font-bold">
                        BAJO STOCK
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="min-h-[48px]">
                      <p className="text-[10px] text-[#E040FB] font-primary uppercase tracking-widest mb-1.5">
                        {p.category || "General"}
                      </p>
                      <h3 className="text-white font-secondary text-sm leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-3 uppercase font-bold tracking-wider">
                          Precio Unit.
                        </span>
                        <span className="text-xl font-primary">
                          ${Number(p.price_usd).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-3 uppercase font-bold tracking-wider">
                          Stock
                        </span>
                        <p
                          className={`text-sm font-bold ${isLow ? "text-status-danger" : "text-status-ok"}`}
                        >
                          {stock} {p.unit || "und"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
