"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { useTreasuryAccounts, registerTreasuryMovement } from "@/hooks/use-treasury";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductoGrid } from "@/components/ventas/nueva/producto-grid";
import { CarritoPanel } from "@/components/ventas/nueva/carrito-panel";
import { ThermalInvoiceModal, type InvoiceOrderData } from "@/components/ventas/thermal-invoice-modal";

export default function NuevaVentaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E040FB]" />
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

  // ── Print Modal State ──────────────────────────────────
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<InvoiceOrderData | null>(null);

  // ── IVA from global settings ───────────────────────────
  const ivaPercent = useMemo(() => {
    const settings = company?.settings ?? (user?.companies?.settings ?? {});
    const stored = settings?.iva_percent ?? settings?.iva ?? 16;
    return Number(stored);
  }, [company, user]);

  // ── Carga inicial de datos ──────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: usr } = await supabase
          .from("users")
          .select("company_id")
          .eq("auth_id", authUser.id)
          .single();
        if (!usr) return;

        const [pRes, prRes, kitsRes, catRes] = await Promise.all([
          supabase
            .from("partners")
            .select("*")
            .eq("company_id", usr.company_id)
            .eq("status", "active"),
          // Regular products (non-kits)
          supabase
            .from("products")
            .select("*")
            .eq("company_id", usr.company_id)
            .eq("status", "active")
            .neq("is_kit", true),
          // Kits with their components for stock explosion
          supabase
            .from("products")
            .select(`
              *,
              product_kit_items!product_kit_items_kit_id_fkey (
                quantity,
                component:component_id (id, name, sku, stock, price_usd)
              )
            `)
            .eq("company_id", usr.company_id)
            .eq("status", "active")
            .eq("is_kit", true),
          supabase
            .from("product_categories")
            .select("name")
            .eq("company_id", usr.company_id)
            .order("name"),
        ]);

        setPartners(pRes.data || []);

        // Process kits: calculate available stock based on component minimums
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

        // Merge regular products + kits into one list
        setProducts([...(prRes.data || []), ...processedKits]);

        if (catRes.data) {
          setCategories(catRes.data.map((c: any) => c.name));
        }

        if (preSelectedPartnerId && pRes.data) {
          const p = pRes.data.find((x) => x.id === preSelectedPartnerId);
          if (p) setSelectedPartner(p);
        }

        // Si estamos editando, cargar el pedido
        if (editOrderId && usr.company_id) {
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
            .eq("company_id", usr.company_id)
            .single();

          if (orderToEdit) {
            setEditingOrder(orderToEdit);
            
            // Setear el cliente
            if (pRes.data && orderToEdit.partner_id) {
              const p = pRes.data.find((x) => x.id === orderToEdit.partner_id);
              if (p) setSelectedPartner(p);
            }

            // Setear el carrito mapeando los renglones antiguos con los productos de la base de datos
            if (orderToEdit.order_items) {
              const loadedCart = orderToEdit.order_items.map((oi: any) => {
                // Conseguir metadata del producto cargado para validación de stock
                const productDbInfo = prRes.data?.find((p:any) => p.id === oi.product_id) || 
                                      processedKits.find((k:any) => k.id === oi.product_id);
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

            // Setear condiciones de pago
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
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!plan.includes("pro") && !plan.includes("enterprise")) {
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

      toast.success(`Pedido ${orderNumber} creado con éxito`);

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
    <div className="flex flex-col h-[calc(100vh-48px)] -m-6 bg-surface-base">
      {/* ── TOPBAR ── */}
      <div className="px-6 py-4 flex-shrink-0 z-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/ventas")}
            className="p-2 hover:bg-[#F8F9FA] rounded-full transition-all text-text-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-outfit text-[#1A1125]">
              {editingOrder ? `Edición de Pedido ${editingOrder.order_number}` : "Nueva Venta"}
            </h1>
            <p className="text-[11px] font-medium text-text-3 font-outfit uppercase tracking-wider">
              {editingOrder ? "Formulario de Presupuesto" : "Facturación POS"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#F8F9FA] px-4 py-2 rounded-xl border border-[#E2E8F0]">
          <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest text-right">Tasa BCV del día:</span>
          <p className="text-[15px] font-bold text-brand font-outfit">
            Bs. {rate?.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden bg-[#F8FAFC]">
        {/* CATÁLOGO */}
        <div className="flex-[7] flex flex-col overflow-hidden">
          <ProductoGrid productos={products} cart={cart} onAdd={addToCart} categories={categories} />
        </div>

        {/* SIDEBAR CARRITO */}
        <div className="flex-[4.2] flex flex-col overflow-hidden bg-[#F8FAFC] p-4 xl:p-6 border-l border-[#F1F5F9]">
          <div className="flex-1 bg-white rounded-[40px] shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-[#EDF2F7] overflow-hidden flex flex-col">
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

      {/* ── THERMAL INVOICE MODAL ── */}
      {printModalOpen && pendingOrderData && (
        <ThermalInvoiceModal
          open={printModalOpen}
          onClose={handleClosePrintModal}
          onSuccess={handlePrintSuccess}
          order={pendingOrderData}
          company={company}
          ivaPercent={ivaPercent}
        />
      )}
    </div>
  );
}
