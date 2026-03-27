"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ClientePicker } from "@/components/ventas/nueva/cliente-picker";
import { ProductoGrid } from "@/components/ventas/nueva/producto-grid";
import { CarritoPanel } from "@/components/ventas/nueva/carrito-panel";

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

  const { user } = useUser();
  const { rate } = useBCV();
  const supabase = createClient();

  // Data State
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);

  // Payment State
  const [paymentType, setPaymentType] = useState<"contado" | "credito">(
    "contado",
  );
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [amountPaid, setAmountPaid] = useState(0);
  const [saving, setSaving] = useState(false);

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

        const [pRes, prRes] = await Promise.all([
          supabase
            .from("partners")
            .select("*")
            .eq("company_id", usr.company_id)
            .eq("status", "active"),
          supabase
            .from("products")
            .select("*")
            .eq("company_id", usr.company_id)
            .eq("status", "active"),
        ]);

        setPartners(pRes.data || []);
        setProducts(prRes.data || []);

        if (preSelectedPartnerId && pRes.data) {
          const p = pRes.data.find((x) => x.id === preSelectedPartnerId);
          if (p) setSelectedPartner(p);
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

  // ── Cart Logic (idéntica al original) ───────────────────
  const addToCart = (product: any) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} añadido`);

    // Feedback háptico en mobile
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

  // ── Crear Pedido (lógica de negocio IDÉNTICA al original) ──
  const handleCreateOrder = async () => {
    if (!selectedPartner) return toast.error("Selecciona un cliente");
    if (cart.length === 0) return toast.error("El carrito está vacío");
    if (!user?.company_id) return;

    setSaving(true);
    try {
      // 1. Crear el Order
      const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
      const status = paymentType === "contado" ? "completed" : "pending";
      const amountDue = total - amountPaid;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          company_id: user.company_id,
          partner_id: selectedPartner.id,
          user_id: user.id,
          order_number: orderNumber,
          status: status,
          total_usd: total,
          total_bs: total * (rate || 0),
          currency: "USD",
          payment_type: paymentType,
          payment_method: paymentMethod,
          amount_paid: amountPaid,
          amount_due: amountDue,
        } as any)
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Crear los Order Items
      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        qty: item.qty,
        price_usd: item.price_usd,
        subtotal: item.price_usd * item.qty,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(items as any);
      if (itemsErr) throw itemsErr;

      // 3. Descontar stock del inventario
      await Promise.all(
        cart.map((item) =>
          supabase
            .from("products")
            .update({ stock: Math.max(0, item.stock - item.qty) } as any)
            .eq("id", item.id),
        ),
      );

      // 4. Si es a CRÉDITO o tiene deuda, crear la CxC (Receivable)
      if (paymentType === "credito" || amountDue > 0) {
        const { error: cxcErr } = await supabase.from("receivables").insert({
          company_id: user.company_id,
          partner_id: selectedPartner.id,
          order_id: order.id,
          invoice_number: `INV-${orderNumber.split("-")[1]}`,
          amount_usd: total,
          paid_usd: amountPaid,
          balance_usd: amountDue,
          status: amountPaid > 0 ? "partial" : "open",
          due_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        } as any);

        if (cxcErr) console.error("Error creating receivable:", cxcErr);
      }

      toast.success(`Pedido ${orderNumber} creado con éxito`);
      router.push("/dashboard/ventas");
    } catch (error: any) {
      toast.error("Error al crear pedido", { description: error.message });
    } finally {
      setSaving(false);
    }
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
      {/* ── TOPBAR POS ── */}
      <div
        className="flex items-center gap-4 px-6 py-3
                            border-b border-border bg-surface-card/60 backdrop-blur-xl
                            flex-shrink-0 z-20"
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-base text-text-3
                               hover:text-text-1 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-primary leading-tight text-text-1">
            Nueva Venta
          </h1>
          {rate !== null && rate > 0 && (
            <p className="text-[10px] text-text-3 font-medium">
              BCV:{" "}
              <span className="text-text-1 font-mono font-semibold">
                Bs.{Number(rate).toFixed(2)}/$
              </span>
            </p>
          )}
        </div>

        {/* Indicador de items en carrito */}
        {cart.length > 0 && (
          <div
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full
                                    bg-brand/10 border border-brand/20"
          >
            <span className="text-xs font-bold text-brand">
              {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
            <span className="text-xs font-mono font-bold text-text-1">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* ── CUERPO: 2 ZONAS ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ZONA A: CLIENTE + CATÁLOGO */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <ClientePicker
            clientes={partners}
            selected={selectedPartner}
            onSelect={(partner) => setSelectedPartner(partner)}
            onClear={() => {
              setSelectedPartner(null);
              setPaymentType("contado");
            }}
          />
          <ProductoGrid productos={products} cart={cart} onAdd={addToCart} />
        </div>

        {/* ZONA B: CARRITO */}
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
        />
      </div>
    </div>
  );
}
