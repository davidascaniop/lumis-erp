"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, Trash2, Package, User, Plus, Minus, Search, X, CheckCircle, Send } from "lucide-react";
import Link from "next/link";

type CartItem = { id: string; name: string; sku: string; price_usd: number; qty: number; stock: number };
type Partner = { id: string; name: string; rif: string; phone: string };
type Product = { id: string; name: string; sku: string; price_usd: number; stock: number; category: string; image_url?: string };

export default function NuevoPresupuestoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#E040FB]" /></div>}>
      <NuevoPresupuestoContent />
    </Suspense>
  );
}

function NuevoPresupuestoContent() {
  const router = useRouter();
  const { user } = useUser();
  const { rate } = useBCV();
  const supabase = createClient();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientRif, setNewClientRif] = useState("");
  const [rifPrefix, setRifPrefix] = useState("V");
  const [newClientPhone, setNewClientPhone] = useState("");

  const submitQuickClient = async () => {
    if (!newClientName || !newClientRif) return toast.error("Nombre y RIF son obligatorios");
    if (!user?.company_id) return;
    setIsSavingQuick(true);
    const rifCompleto = newClientRif.includes("-") || newClientRif.startsWith("V") || newClientRif.startsWith("J") || newClientRif.startsWith("E") 
      ? newClientRif 
      : `${rifPrefix}-${newClientRif}`;
    
    try {
      const { data: newP, error: pErr } = await supabase
        .from("partners")
        .insert({
          company_id: user.company_id,
          name: newClientName,
          rif: rifCompleto,
          phone: newClientPhone,
          status: "active",
          credit_status: "green",
          current_balance: 0,
        } as any)
        .select()
        .single();

      if (pErr) throw pErr;
      
      setPartners(prev => [...prev, newP]);
      setSelectedPartner(newP);
      setPartnerQuery(newClientName);
      setNewClientName("");
      setNewClientRif("");
      setNewClientPhone("");
      toast.success("Cliente creado con éxito");
      setShowQuickModal(false);
    } catch (err: any) {
      toast.error("Error al crear cliente rápido", { description: err.message });
    } finally {
      setIsSavingQuick(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data: usr } = await supabase.from("users").select("company_id").eq("auth_id", authUser.id).single();
        if (!usr) return;

        const [pRes, prRes] = await Promise.all([
          supabase.from("partners").select("id, name, rif, phone").eq("company_id", (usr as any).company_id).eq("status", "active"),
          supabase.from("products").select("id, name, sku, price_usd, stock, category, image_url").eq("company_id", (usr as any).company_id).eq("status", "active"),
        ]);
        setPartners((pRes.data as Partner[]) || []);
        setProducts((prRes.data as Product[]) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const partnerSuggestions = useMemo(() => {
    if (!partnerQuery || partnerQuery.length < 1 || selectedPartner) return [];
    return partners.filter((p) => p.name.toLowerCase().includes(partnerQuery.toLowerCase())).slice(0, 6);
  }, [partners, partnerQuery, selectedPartner]);

  const filteredProducts = useMemo(() => {
    if (!productQuery) return products.slice(0, 20);
    return products.filter(
      (p) => p.name.toLowerCase().includes(productQuery.toLowerCase()) || p.sku?.toLowerCase().includes(productQuery.toLowerCase())
    ).slice(0, 20);
  }, [products, productQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, sku: product.sku, price_usd: product.price_usd, qty: 1, stock: product.stock }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.price_usd * i.qty, 0), [cart]);
  const subtotalBs = subtotal * (rate || 0);

  const handleSave = async () => {
    if (!selectedPartner) return toast.error("Selecciona un cliente para la cotización");
    if (cart.length === 0) return toast.error("Agrega al menos un producto");
    if (!user?.company_id) return;

    setSaving(true);
    try {
      const quoteNumber = `COT-${Date.now().toString().slice(-6)}`;

      const { data: quote, error: qErr } = await supabase
        .from("quotes")
        .insert({
          company_id: user.company_id,
          partner_id: selectedPartner.id,
          user_id: user.id,
          quote_number: quoteNumber,
          status: "open",
          total_usd: subtotal,
          total_bs: subtotalBs,
          notes,
        } as any)
        .select()
        .single();

      if (qErr) throw qErr;

      const items = cart.map((i) => ({
        quote_id: quote.id,
        product_id: i.id,
        qty: i.qty,
        price_usd: i.price_usd,
        product_name: i.name,
        product_sku: i.sku,
      }));

      const { error: iErr } = await supabase.from("quote_items").insert(items as any);
      if (iErr) throw iErr;

      toast.success(`Cotización ${quoteNumber} creada`, { description: `Total: $${subtotal.toFixed(2)}` });
      router.push("/dashboard/ventas/presupuestos");
    } catch (err: any) {
      toast.error("Error al guardar cotización", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#E040FB] mx-auto" />
          <p className="text-sm text-text-3">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] -m-6 bg-surface-base">
      {/* Topbar */}
      <div className="px-6 py-4 flex-shrink-0 z-20 bg-white dark:bg-surface-elevated border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/ventas/presupuestos")} className="p-2 hover:bg-surface-hover/10 rounded-full transition-all text-text-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-outfit text-text-1">Nueva Cotización</h1>
            <p className="text-[11px] font-medium text-text-3 uppercase tracking-wider">Presupuesto Profesional</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface-hover/5 px-4 py-2 rounded-xl border border-border">
          <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Tasa BCV:</span>
          <p className="text-[15px] font-bold text-brand font-outfit">Bs. {rate?.toFixed(2)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── CATÁLOGO IZQUIERDA ── */}
        <div className="flex-[7] flex flex-col overflow-hidden bg-surface-base p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar producto por nombre o SKU..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-elevated border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:border-brand/40 transition-all shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 opacity-40">
                <Package className="w-8 h-8 mb-2 text-text-3" />
                <p className="text-sm font-bold text-text-3 uppercase">Sin resultados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-10">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((i) => i.id === p.id);
                  return (
                    <div key={p.id} className={`bg-white dark:bg-surface-elevated rounded-2xl p-4 border border-border shadow-card hover:shadow-md transition-all flex items-center gap-4 ${p.stock <= 0 ? "opacity-50 pointer-events-none" : ""}`}>
                      <div className="w-14 h-14 rounded-xl bg-surface-base flex items-center justify-center flex-shrink-0 border border-border">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1 rounded-xl" /> : <Package className="w-6 h-6 text-text-3 opacity-30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-text-1 truncate">{p.name}</h3>
                        <p className="text-lg font-bold text-brand">$ {Number(p.price_usd).toFixed(2)}</p>
                        <p className="text-[10px] text-text-3 font-semibold uppercase">Stock: {p.stock}</p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${inCart ? "bg-status-ok/10 text-status-ok border border-status-ok/20" : "bg-brand text-white hover:opacity-90 active:scale-95 shadow-lg shadow-brand/10"}`}
                      >
                        {inCart ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO (COTIZACIÓN) ── */}
        <div className="flex-[4] flex flex-col overflow-hidden border-l border-border bg-white dark:bg-surface-elevated p-6 space-y-5">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-text-3 uppercase tracking-widest">
              <User className="w-3 h-3" /> Cliente
            </label>
            <div className="relative">
              {selectedPartner ? (
                <div className="flex items-center justify-between px-4 py-3 bg-brand/5 rounded-xl border border-brand/20">
                  <div>
                    <p className="text-[13px] font-bold text-text-1">{selectedPartner.name}</p>
                    <p className="text-[10px] text-text-3">{selectedPartner.rif}</p>
                  </div>
                  <button onClick={() => { setSelectedPartner(null); setPartnerQuery(""); }} className="text-text-3 hover:text-danger p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                  <input
                    value={partnerQuery}
                    onChange={(e) => { setPartnerQuery(e.target.value); setShowPartnerDropdown(true); }}
                    onFocus={() => setShowPartnerDropdown(true)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-base rounded-xl border border-border text-sm focus:outline-none focus:border-brand/40 transition-all"
                  />
                  {showPartnerDropdown && partnerQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-md z-[100] overflow-hidden">
                      {partnerSuggestions.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPartner(p); setPartnerQuery(p.name); setShowPartnerDropdown(false); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-brand/5 border-b border-[#F1F5F9] last:border-0 transition-colors"
                        >
                          <p className="text-[12px] font-bold text-text-1 font-outfit">{p.name}</p>
                          <p className="text-[9px] text-text-3 font-outfit uppercase">{p.rif || "Sin RIF"}</p>
                        </button>
                      ))}
                      {!partnerSuggestions.some(p => p.name.toLowerCase() === partnerQuery.toLowerCase()) && (
                        <button
                          onClick={() => { setShowPartnerDropdown(false); setNewClientName(partnerQuery); setShowQuickModal(true); }}
                          className="w-full px-4 py-3 text-left hover:bg-brand/5 border-t border-[#F1F5F9] flex items-center gap-2 group transition-colors"
                        >
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[12px] font-bold text-brand font-outfit">+ Crear cliente rápido</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <p className="text-[11px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Productos ({cart.length})
            </p>
            {cart.length === 0 ? (
              <div className="py-8 text-center opacity-30">
                <Package className="w-8 h-8 mx-auto mb-2 text-text-3" />
                <p className="text-xs font-bold text-text-3 uppercase">Agrega productos del catálogo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-3 bg-surface-base rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-text-1 truncate">{item.name}</p>
                      <p className="text-[10px] text-text-3">$ {item.price_usd.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-surface-elevated rounded-lg border border-border p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-text-3 hover:text-text-1">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-text-1 w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-text-3 hover:text-text-1">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[13px] font-bold text-text-1 w-16 text-right">$ {(item.price_usd * item.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-text-3 hover:text-danger transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="text-[11px] font-bold text-text-3 uppercase tracking-widest block mb-1.5">Notas (op.)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones de pago, tiempo de entrega, observaciones..."
              rows={2}
              className="w-full px-3 py-2.5 bg-surface-base rounded-xl border border-border text-sm text-text-1 focus:outline-none focus:border-brand/40 transition-all resize-none placeholder:text-text-3"
            />
          </div>

          {/* Total y acciones */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-bold text-text-3 uppercase tracking-wider">Total Cotización:</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand">$ {subtotal.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-text-3 uppercase">Bs. {(subtotalBs).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || cart.length === 0 || !selectedPartner}
              className={`w-full py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                saving || cart.length === 0 || !selectedPartner
                  ? "bg-surface-hover/20 text-text-3 cursor-not-allowed"
                  : "bg-brand-gradient text-white shadow-brand hover:opacity-90"
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Guardar Cotización</>}
            </button>

            <a
              href={selectedPartner && cart.length > 0 
                ? `https://wa.me/${selectedPartner.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${selectedPartner.name}, le envío su cotización por $${subtotal.toFixed(2)}. Por favor confirme para procesar su pedido.`)}`
                : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!selectedPartner || cart.length === 0) e.preventDefault(); }}
              className={`w-full py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                !selectedPartner || cart.length === 0
                  ? "border-border text-text-3 opacity-40 cursor-not-allowed"
                  : "border-green-500/30 text-green-600 hover:bg-green-500/5"
              }`}
            >
              <Send className="w-4 h-4" /> Enviar por WhatsApp
            </a>

            <Link
              href="/dashboard/ventas/presupuestos"
              className="w-full py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest border border-border text-text-3 hover:bg-surface-hover/10 transition-all flex items-center justify-center"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>

      {/* ── MODAL CLIENTE RÁPIDO ── */}
      {showQuickModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit text-[#1A1125]">Crear Cliente Rápido</h3>
              <button onClick={() => setShowQuickModal(false)} className="text-text-3 hover:text-danger transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Nombre Completo *</label>
                <input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 font-outfit bg-[#F8FAFC]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Cédula / RIF *</label>
                <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-brand/40">
                  <select 
                    value={rifPrefix}
                    onChange={(e) => setRifPrefix(e.target.value)}
                    className="bg-transparent pl-3 pr-1 py-2.5 text-[13px] font-bold text-brand font-outfit outline-none cursor-pointer appearance-none"
                  >
                    <option value="V">V</option>
                    <option value="J">J</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    value={newClientRif}
                    onChange={(e) => setNewClientRif(e.target.value)}
                    className="w-full px-2 py-2.5 bg-transparent text-[13px] font-medium outline-none font-outfit"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Teléfono (Opcional)</label>
                <input
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 font-outfit bg-[#F8FAFC]"
                  placeholder="0414-0000000"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowQuickModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-text-3 hover:bg-[#E2E8F0] transition-colors font-outfit uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={submitQuickClient}
                disabled={isSavingQuick || !newClientName || !newClientRif}
                className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold font-outfit uppercase disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
              >
                {isSavingQuick && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
