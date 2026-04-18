"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { useTreasuryAccounts, registerTreasuryMovement } from "@/hooks/use-treasury";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { useDataCache } from "@/lib/data-cache";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LayoutGrid, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductoGrid } from "@/components/ventas/nueva/producto-grid";
import { CarritoPanel } from "@/components/ventas/nueva/carrito-panel";
import { ThermalInvoiceModal, type InvoiceOrderData } from "@/components/ventas/thermal-invoice-modal";
import { PendingTablesBadge } from "@/components/restaurant/pending-tables-badge";
import { CollectTableModal } from "@/components/restaurant/collect-table-modal";

export default function NuevaVentaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen overflow-hidden bg-surface-base">
          <div className="flex-1 p-6 space-y-6">
            <div className="h-16 w-1/3 bg-surface-card rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({length: 8}).map((_,i) => <div key={i} className="h-48 bg-surface-card rounded-2xl animate-pulse" />)}
            </div>
          </div>
          <div className="hidden lg:block w-[420px] bg-surface-card border-l border-border animate-pulse" />
        </div>
      }
    >
      <NuevaVentaContent />
    </Suspense>
  );
}

function NuevaVentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPartnerId = searchParams.get("partner_id");
  const editOrderId = searchParams.get("edit");

  const { user } = useUser();
  const { rate } = useBCV();
  const { accounts: treasuryAccounts } = useTreasuryAccounts(user?.company_id);
  const { company } = useCompanyProfile(user?.company_id);
  const supabase = createClient();

  // Data State
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);

  // Categories State
  const [categories, setCategories] = useState<string[]>([]);

  // Payment State
  const [paymentType, setPaymentType] = useState<"contado" | "credito">("contado");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [amountPaid, setAmountPaid] = useState(0);
  const [saving, setSaving] = useState(false);
  const [treasuryAccountId, setTreasuryAccountId] = useState("");
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // New Client State
  const [newClientName, setNewClientName] = useState("");
  const [newClientRif, setNewClientRif] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  // ── Mobile view toggle: en pantallas <md solo una vista visible a la vez ──
  const [mobileView, setMobileView] = useState<"catalog" | "cart">("catalog");

  // ── Print Modal State ──────────────────────────────────
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<InvoiceOrderData | null>(null);

  // ── Restaurant Integration State ───────────────────────
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingTableId, setCollectingTableId] = useState<string | null>(null);
  const [collectingOrderId, setCollectingOrderId] = useState<string | null>(null);
  const [collectingTableName, setCollectingTableName] = useState("");
  const [collectingWaiterName, setCollectingWaiterName] = useState("");
  const modulesEnabled: string[] = user?.companies?.modules_enabled || [];

  // ── IVA from global settings ───────────────────────────
  const ivaPercent = useMemo(() => {
    const settings = company?.settings ?? (user?.companies?.settings ?? {});
    const stored = settings?.iva_percent ?? settings?.iva ?? 16;
    return Number(stored);
  }, [company, user]);

  // ── Carga inicial con cache para navegación instantánea ──
  useEffect(() => {
    const companyId = user?.company_id;
    if (!companyId) return;

    const cacheKey = `nueva_venta_${companyId}`;
    const cached = useDataCache.getState().get(cacheKey);

    // If cached data exists, show it IMMEDIATELY (no loading spinner)
    if (cached) {
      setPartners(cached.partners);
      setProducts(cached.products);
      setCategories(cached.categories);
      if (preSelectedPartnerId && cached.partners) {
        const p = cached.partners.find((x: any) => x.id === preSelectedPartnerId);
        if (p) setSelectedPartner(p);
      }
      setLoading(false);
    }

    async function loadData() {
      // Only show loading spinner on FIRST visit (no cache)
      if (!cached) setLoading(true);
      try {
        const [pRes, prRes, kitsRes, catRes] = await Promise.all([
          supabase
            .from("partners")
            .select("*")
            .eq("company_id", companyId)
            .eq("status", "active"),
          supabase
            .from("products")
            .select("*")
            .eq("company_id", companyId)
            .eq("status", "active")
            .neq("is_kit", true),
          supabase
            .from("products")
            .select(`
              *,
              product_kit_items!product_kit_items_kit_id_fkey (
                quantity,
                component:component_id (id, name, sku, stock, price_usd)
              )
            `)
            .eq("company_id", companyId)
            .eq("status", "active")
            .eq("is_kit", true),
          supabase
            .from("product_categories")
            .select("name")
            .eq("company_id", companyId)
            .order("name"),
        ]);

        const partnersData = pRes.data || [];

        const processedKits = (kitsRes.data || []).map((k: any) => {
          const comps = (k.product_kit_items || []).map((pki: any) => ({
            ...(pki.component || {}),
            qty_required: pki.quantity,
          })).filter((c: any) => c.id);

          let availableStock = comps.length > 0 ? 999999 : 0;
          comps.forEach((c: any) => {
            if (c.qty_required > 0) {
              const maxForThis = Math.floor((c.stock || 0) / c.qty_required);
              if (maxForThis < availableStock) availableStock = maxForThis;
            }
          });

          return { ...k, comps, availableStock, is_kit: true };
        });

        const allProducts = [...(prRes.data || []), ...processedKits];
        const categoriesData = catRes.data ? catRes.data.map((c: any) => c.name) : [];

        // Save to cache for instant load next time
        useDataCache.getState().set(cacheKey, {
          partners: partnersData,
          products: allProducts,
          categories: categoriesData,
        });

        // Batch updates juntas para evitar cascada de re-renders.
        // React 18+ auto-batching ya combina estos updates dentro del mismo
        // microtask async, pero dejamos el comentario para que quede claro
        // que el orden importa: preSelected debe leerse de partnersData (no
        // del state que todavía no se commiteó).
        setPartners(partnersData);
        setProducts(allProducts);
        setCategories(categoriesData);

        if (preSelectedPartnerId && partnersData.length > 0) {
          const p = partnersData.find((x: any) => x.id === preSelectedPartnerId);
          if (p) setSelectedPartner(p);
        }

        // Edit order handling
        if (editOrderId && companyId) {
          const { data: orderToEdit } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                product_id,
                qty,
                price_usd,
                is_kit,
                kit_name,
                products ( name, stock )
              )
            `)
            .eq("id", editOrderId)
            .eq("company_id", companyId)
            .single();

          if (orderToEdit) {
            setEditingOrder(orderToEdit);
            if (partnersData && orderToEdit.partner_id) {
              const p = partnersData.find((x: any) => x.id === orderToEdit.partner_id);
              if (p) setSelectedPartner(p);
            }
            if (orderToEdit.order_items) {
              const loadedCart = orderToEdit.order_items.map((oi: any) => {
                const productDbInfo = prRes.data?.find((p: any) => p.id === oi.product_id) ||
                                      processedKits.find((k: any) => k.id === oi.product_id);
                return {
                  id: oi.product_id,
                  name: oi.products?.name || oi.kit_name || "Producto desconocido",
                  qty: oi.qty,
                  price_usd: oi.price_usd,
                  stock: productDbInfo ? (productDbInfo.availableStock ?? productDbInfo.stock ?? 0) : oi.products?.stock ?? 0,
                  is_kit: oi.is_kit,
                  comps: productDbInfo ? productDbInfo.comps : []
                };
              });
              setCart(loadedCart);
            }
            setPaymentType(orderToEdit.payment_type || "contado");
            setPaymentMethod(orderToEdit.payment_method || "Efectivo");
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.company_id]);

  // ── Cart Logic ───────────────────────────────────────────
  const addToCart = (product: any, qty: number = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item,
        );
      }
      return [...prev, { ...product, qty }];
    });
    toast.success(`${product.name} añadido`);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  // Totales
  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price_usd * item.qty, 0),
    [cart],
  );
  const total = subtotal;

  // Sincronizar amountPaid con total cuando es contado
  useEffect(() => {
    if (paymentType === "contado") {
      setAmountPaid(total);
    }
  }, [total, paymentType]);

  // ── Crear Cliente Rápido ──
  const handleCreateQuickClient = async (
    name: string,
    rif: string,
    phone: string,
    address: string,
  ): Promise<boolean> => {
    if (!user?.company_id) return false;

    const plan = user?.companies?.plan_type?.toLowerCase() || "starter";
    const isDemo = user?.companies?.subscription_status === "demo";
    if (!isDemo && !plan.includes("pro") && !plan.includes("enterprise")) {
      const { count } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user.company_id);
      if (count !== null && count >= 50) {
        toast.error("Alcanzaste el límite de tu plan, mejora a Pro Business para clientes ilimitados");
        return false;
      }
    }

    try {
      const { data: newP, error: pErr } = await supabase
        .from("partners")
        .insert({
          company_id: user.company_id,
          name,
          rif,
          phone,
          address,
          status: "active",
          credit_status: "green",
          current_balance: 0,
        } as any)
        .select()
        .single();

      if (pErr) throw pErr;

      setPartners((prev) => [...prev, newP]);
      setSelectedPartner(newP);
      setNewClientName(name);
      setNewClientRif(rif);
      setNewClientPhone(phone);
      setNewClientAddress(address);
      toast.success("Cliente creado con éxito");
      return true;
    } catch (err: any) {
      toast.error("Error al crear cliente rápido", { description: err.message });
      return false;
    }
  };

  // ── Crear Pedido ──────────────────────────────────────────
  const handleCreateOrder = async () => {
    let targetPartner = selectedPartner;

    if (!targetPartner && newClientName && newClientRif) {
      setSaving(true);
      try {
        const { data: newP, error: pErr } = await supabase
          .from("partners")
          .insert({
            company_id: user?.company_id,
            name: newClientName,
            rif: newClientRif,
            phone: newClientPhone,
            status: "active",
            credit_status: "green",
            current_balance: 0,
          } as any)
          .select()
          .single();

        if (pErr) throw pErr;
        targetPartner = newP;
        setSelectedPartner(newP);
      } catch (err: any) {
        toast.error("Error al crear cliente rápido", { description: err.message });
        setSaving(false);
        return;
      }
    }

    if (!targetPartner) return toast.error("Selecciona o registra un cliente");
    if (cart.length === 0) return toast.error("El carrito está vacío");
    if (!user?.company_id) return;

    setSaving(true);
    try {
      const orderNumber = editingOrder ? editingOrder.order_number : `PED-${Date.now().toString().slice(-6)}`;
      const status = paymentType === "contado" ? "completed" : "pending";
      const finalAmountPaid = paymentType === "contado" ? total : amountPaid;
      const amountDue = total - finalAmountPaid;

      // Update if editing, insert if new
      let order: any;
      if (editingOrder) {
        const { data: updatedOrder, error: orderErr } = await supabase
          .from("orders")
          .update({
            partner_id: targetPartner.id,
            status,
            total_usd: total,
            total_bs: total * (rate || 0),
            payment_type: paymentType,
            payment_method: paymentMethod,
            amount_paid: finalAmountPaid,
            amount_due: amountDue,
          })
          .eq("id", editingOrder.id)
          .select()
          .single();
        if (orderErr) throw orderErr;
        
        // Delete old items so we can insert new ones
        await supabase.from("order_items").delete().eq("order_id", editingOrder.id);
        order = updatedOrder;
      } else {
        const { data: newOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            company_id: user.company_id,
            partner_id: targetPartner.id,
            user_id: user.id,
            order_number: orderNumber,
            status,
            total_usd: total,
            total_bs: total * (rate || 0),
            currency: "USD",
            payment_type: paymentType,
            payment_method: paymentMethod,
            amount_paid: finalAmountPaid,
            amount_due: amountDue,
          } as any)
          .select()
          .single();
        if (orderErr) throw orderErr;
        order = newOrder;
      }

      // Order items
      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        qty: item.qty,
        price_usd: item.price_usd,
        subtotal: item.price_usd * item.qty,
        is_kit: !!item.is_kit,
        kit_name: item.is_kit ? item.name : null,
        kit_description: item.is_kit && item.comps?.length > 0 
          ? `Incluye: ${item.comps.map((c: any) => `${c.qty_required}x ${c.name}`).join(", ")}` 
          : null,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items as any);
      if (itemsErr) throw itemsErr;

      // Discount stock: regular products directly, kits explode into components
      await Promise.all(
        cart.map(async (item) => {
          if (item.is_kit && Array.isArray(item.comps) && item.comps.length > 0) {
            // Explode kit: decrement each component's stock
            await Promise.all(
              item.comps.map(async (comp: any) => {
                const deduct = comp.qty_required * item.qty;
                const newStock = Math.max(0, (comp.stock || 0) - deduct);
                await supabase
                  .from("products")
                  .update({ stock: newStock } as any)
                  .eq("id", comp.id);
              })
            );
          } else if (!item.is_kit) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, item.stock - item.qty) } as any)
              .eq("id", item.id);
          }
        })
      );

      // CxC if credit or partial payment
      if (paymentType === "credito" || amountDue > 0) {
        const { error: cxcErr } = await supabase.from("receivables").insert({
          company_id: user.company_id,
          partner_id: targetPartner.id,
          order_id: order.id,
          invoice_number: `INV-${orderNumber.split("-")[1]}`,
          amount_usd: total,
          paid_usd: amountPaid,
          balance_usd: amountDue,
          status: amountPaid > 0 ? "partial" : "open",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        } as any);
        if (cxcErr) console.error("Error creating receivable:", cxcErr);
      }

      // Treasury movement
      if (amountPaid > 0 && treasuryAccountId) {
        try {
          const result = await registerTreasuryMovement({
            companyId: user.company_id,
            accountId: treasuryAccountId,
            type: "entrada",
            amount: amountPaid,
            currency: "usd",
            description: `Venta ${orderNumber} - ${targetPartner.name}`,
            category: "Venta",
            originModule: "ventas",
            referenceId: order.id,
            bcvRate: rate ?? undefined,
          });
          if (result.isLowBalance) {
            toast.warning(`${result.accountName} tiene saldo bajo: $${result.newBalance.toFixed(2)}`);
          }
        } catch (err) {
          console.warn("Error registrando en tesorería:", err);
        }
      }

      // ── Restaurant: close table and order after collection ──
      if (collectingTableId && collectingOrderId) {
        try {
          await supabase
            .from("restaurant_orders")
            .update({ status: "cobrada", closed_at: new Date().toISOString() })
            .eq("id", collectingOrderId);
          await supabase
            .from("restaurant_tables")
            .update({ status: "libre", current_order_id: null })
            .eq("id", collectingTableId);
          // Reset restaurant state
          setCollectingTableId(null);
          setCollectingOrderId(null);
          setCollectingTableName("");
          setCollectingWaiterName("");
        } catch (err) {
          console.warn("Error closing restaurant table:", err);
        }
      }

      toast.success(`Pedido ${orderNumber} creado con éxito`);

      // Invalidar caches afectados: el historial de ventas debe ver el
      // nuevo pedido, los productos cambiaron de stock, y si se creó una
      // cuenta por cobrar también afecta cobranza.
      if (user?.company_id) {
        const cid = user.company_id;
        useDataCache.getState().invalidate(`ventas_${cid}`);
        useDataCache.getState().invalidate(`presupuestos_${cid}`);
        useDataCache.getState().invalidatePrefix("productos_");
        useDataCache.getState().invalidatePrefix("cobranza_");
      }

      // ── Open print modal instead of redirecting immediately ──
      setPendingOrderData({
        id: order.id,
        orderNumber,
        createdAt: order.created_at ?? new Date().toISOString(),
        paymentMethod,
        paymentType,
        totalUsd: total,
        totalBs: total * (rate || 0),
        bcvRate: rate || 0,
        items: cart.map((item) => ({
          name: item.name,
          qty: item.qty,
          price_usd: item.price_usd,
        })),
        client: targetPartner
          ? {
              name: targetPartner.name,
              rif: targetPartner.rif ?? undefined,
              phone: targetPartner.phone ?? undefined,
              address: targetPartner.address ?? newClientAddress ?? undefined,
            }
          : null,
      });
      setPrintModalOpen(true);
    } catch (error: any) {
      toast.error("Error al procesar la venta", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!editingOrder) return;
    if (!selectedPartner) return toast.error("Selecciona un cliente");
    if (cart.length === 0) return toast.error("El carrito está vacío");

    setSaving(true);
    try {
      // Validar si hay stock pero SIN descontarlo, es solo edición de presupuesto
      const hasErrors = cart.some(item => item.qty > item.stock);
      if (hasErrors) {
        toast.error("Hay items en el presupuesto que exceden el stock disponible.");
        setSaving(false);
        return;
      }

      // Update Order as 'draft' or 'pending' whatever it was
      const { error: orderErr } = await supabase
        .from("orders")
        .update({
          partner_id: selectedPartner.id,
          total_usd: total,
          total_bs: total * (rate || 0),
          payment_type: paymentType,
          payment_method: paymentMethod,
        })
        .eq("id", editingOrder.id);
        
      if (orderErr) throw orderErr;

      // Delete old items and insert current ones
      await supabase.from("order_items").delete().eq("order_id", editingOrder.id);
      
      const items = cart.map((item) => ({
        order_id: editingOrder.id,
        product_id: item.id,
        qty: item.qty,
        price_usd: item.price_usd,
        subtotal: item.price_usd * item.qty,
        is_kit: !!item.is_kit,
        kit_name: item.is_kit ? item.name : null,
        kit_description: item.is_kit && item.comps?.length > 0 
          ? `Incluye: ${item.comps.map((c: any) => `${c.qty_required}x ${c.name}`).join(", ")}` 
          : null,
      }));
      
      const { error: itemsErr } = await supabase.from("order_items").insert(items as any);
      if (itemsErr) throw itemsErr;

      toast.success("Presupuesto modificado exitosamente");

      // Invalidar caches: el historial cambió (orden editada) y los items
      // pueden haberse modificado.
      if (user?.company_id) {
        const cid = user.company_id;
        useDataCache.getState().invalidate(`ventas_${cid}`);
        useDataCache.getState().invalidate(`presupuestos_${cid}`);
      }
      router.push("/dashboard/ventas");
    } catch (error: any) {
      toast.error("Error al guardar cambios", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClosePrintModal = () => {
    setPrintModalOpen(false);
    setPendingOrderData(null);
    router.push("/dashboard/ventas");
  };

  // ── onSuccess: toast + redirigir después de 2s ────────────
  const handlePrintSuccess = () => {
    setPrintModalOpen(false);
    setPendingOrderData(null);
    toast.success("✅ Venta finalizada con éxito", {
      description: "Redirigiendo al historial...",
      duration: 2500,
    });
    setTimeout(() => router.push("/dashboard/ventas"), 2000);
  };

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#E040FB] mx-auto" />
          <p className="text-sm text-[#9585B8]">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-48px)] -m-3 sm:-m-4 md:-m-6 bg-surface-base">
      {/* ── TOPBAR ── responsive */}
      <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 flex-shrink-0 z-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <button
            onClick={() => router.push("/dashboard/ventas")}
            className="p-2 hover:bg-[#F8F9FA] rounded-full transition-all text-text-3 shrink-0 active:scale-95"
            aria-label="Volver a ventas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base md:text-xl font-bold font-outfit text-[#1A1125] truncate">
              {editingOrder ? `Edición ${editingOrder.order_number}` : "Nueva Venta"}
            </h1>
            <p className="hidden sm:block text-[11px] font-medium text-text-3 font-outfit uppercase tracking-wider">
              {editingOrder ? "Formulario de Presupuesto" : "Facturación POS"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Restaurant: Cobrar Mesa badge */}
          {modulesEnabled.includes('restaurante') && (
            <PendingTablesBadge
              companyId={user?.company_id}
              onClick={() => setShowCollectModal(true)}
            />
          )}
          {/* BCV pill — compacta en mobile, extendida en desktop */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#F8F9FA] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-[#E2E8F0]">
            <span className="hidden md:inline text-[10px] font-bold text-text-3 uppercase tracking-widest text-right">
              Tasa BCV del día:
            </span>
            <span className="md:hidden text-[9px] font-bold text-text-3 uppercase tracking-widest">
              BCV:
            </span>
            <p className="text-[13px] md:text-[15px] font-bold text-brand font-outfit whitespace-nowrap">
              Bs. {rate?.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ── responsive: mobile toggle catálogo/carrito · desktop split */}
      <div className="flex flex-1 overflow-hidden bg-[#F8FAFC] min-h-0">
        {/* CATÁLOGO — visible en mobile solo cuando view=catalog · siempre visible en desktop */}
        <div
          className={cn(
            "flex-col overflow-hidden flex-1 md:flex-[7]",
            mobileView === "catalog" ? "flex" : "hidden md:flex",
          )}
        >
          <ProductoGrid productos={products} cart={cart} onAdd={addToCart} categories={categories} />
        </div>

        {/* SIDEBAR CARRITO — visible en mobile solo cuando view=cart · siempre visible en desktop */}
        <div
          className={cn(
            "flex-col overflow-hidden bg-[#F8FAFC] p-0 md:p-4 xl:p-6 md:border-l border-[#F1F5F9] flex-1 md:flex-[4.2]",
            mobileView === "cart" ? "flex" : "hidden md:flex",
          )}
        >
          <div className="flex-1 bg-white rounded-none md:rounded-[40px] shadow-none md:shadow-[0_12px_40px_rgba(0,0,0,0.03)] border-0 md:border border-[#EDF2F7] overflow-hidden flex flex-col">
            <CarritoPanel
              cart={cart}
              onUpdateQty={updateQty}
              onRemove={removeFromCart}
              condition={paymentType}
              onConditionChange={(v) => {
                setPaymentType(v);
                if (v === "contado") setAmountPaid(total);
              }}
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              subtotal={subtotal}
              bcvRate={rate || 0}
              cliente={selectedPartner}
              onSubmit={handleCreateOrder}
              submitting={saving}
              amountPaid={amountPaid}
              onAmountPaidChange={setAmountPaid}
              newClientName={newClientName}
              setNewClientName={setNewClientName}
              newClientRif={newClientRif}
              setNewClientRif={setNewClientRif}
              newClientPhone={newClientPhone}
              setNewClientPhone={setNewClientPhone}
              newClientAddress={newClientAddress}
              setNewClientAddress={setNewClientAddress}
              partners={partners}
              onSelectPartner={setSelectedPartner}
              onCreateQuickClient={handleCreateQuickClient}
              treasuryAccounts={treasuryAccounts}
              treasuryAccountId={treasuryAccountId}
              onTreasuryAccountChange={setTreasuryAccountId}
              isEditing={!!editingOrder}
              onSaveDraft={handleSaveDraft}
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM TAB BAR (mobile only) ──
          Toggle entre "Catálogo" y "Carrito". El carrito muestra un badge
          con la cantidad de ítems. */}
      <div className="md:hidden flex-shrink-0 grid grid-cols-2 gap-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => setMobileView("catalog")}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors active:scale-95",
            mobileView === "catalog"
              ? "text-brand"
              : "text-text-3",
          )}
          aria-pressed={mobileView === "catalog"}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Productos
          </span>
          {mobileView === "catalog" && (
            <span className="absolute top-0 left-0 right-1/2 h-0.5 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]" />
          )}
        </button>

        <button
          onClick={() => setMobileView("cart")}
          className={cn(
            "relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors active:scale-95",
            mobileView === "cart"
              ? "text-brand"
              : "text-text-3",
          )}
          aria-pressed={mobileView === "cart"}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#FF2D55] text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-[0_0_10px_rgba(255,45,85,0.5)]">
                {cart.length > 9 ? "9+" : cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Carrito
          </span>
          {mobileView === "cart" && (
            <span className="absolute top-0 left-1/2 right-0 h-0.5 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]" />
          )}
        </button>
      </div>

      {/* ── THERMAL INVOICE MODAL ── */}
      {printModalOpen && pendingOrderData && (
        <ThermalInvoiceModal
          open={printModalOpen}
          onClose={handleClosePrintModal}
          onSuccess={handlePrintSuccess}
          order={pendingOrderData}
          company={company}
        />
      )}

      {/* ── RESTAURANT: COLLECT TABLE MODAL ── */}
      {modulesEnabled.includes('restaurante') && (
        <CollectTableModal
          open={showCollectModal}
          onClose={() => setShowCollectModal(false)}
          companyId={user?.company_id || ""}
          onSelectTable={(tableId, orderId, items, tableName, waiterName) => {
            // Load restaurant items into POS cart
            setCollectingTableId(tableId);
            setCollectingOrderId(orderId);
            setCollectingTableName(tableName);
            setCollectingWaiterName(waiterName);
            const cartItems = items.map((i: any) => ({
              id: i.product_id || i.id,
              name: i.product_name,
              price_usd: i.unit_price,
              qty: i.quantity,
              stock: 999, // Restaurant items don't track stock
              is_kit: false,
              comps: [],
              _restaurant_item: true,
              _modifications: i.modifications,
            }));
            setCart(cartItems);
            toast.success(`Mesa "${tableName}" cargada al POS`);
          }}
        />
      )}
    </div>
  );
}
