"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function confirmOrder(orderId: string) {
  const supabase = await createClient();

  // 1. Obtener la data del pedido
  const { data: rawOrder, error: orderErr } = await supabase
    .from("orders")
    .select("*, partners(credit_status, current_balance, payment_terms)")
    .eq("id", orderId)
    .single();

  if (orderErr || !rawOrder) return { error: "Pedido no encontrado" };
  const order = rawOrder as any;

  // 1b. Validar status (asumimos regla de negocio general)
  if (order.partners?.credit_status === "red") {
    return {
      error:
        "El cliente está en mora. Requiere aprobación manual de Supervisor.",
    };
  }

  // 2. Generar numero de factura y fechas
  const confirmedAt = new Date().toISOString();

  // Fake sequence for invoice
  const { count } = await supabase
    .from("receivables")
    .select("*", { count: "exact", head: true })
    .eq("company_id", order.company_id);
  const invoiceNumber = `FAC-${String((count || 0) + 1).padStart(5, "0")}`;

  const terms = order.partners?.payment_terms || 7;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + terms);

  // 3. Crear CxC
  const { error: rxError } = await supabase.from("receivables").insert({
    company_id: order.company_id,
    order_id: order.id,
    partner_id: order.partner_id,
    invoice_number: invoiceNumber,
    amount_usd: order.total_usd,
    balance_usd: order.total_usd, // Totalmente pendiente
    due_date: dueDate.toISOString(),
    status: "open",
  } as any);

  if (rxError) return { error: "Error al generar cuenta por cobrar" };

  // 4. Actualizar partner
  const newBalance =
    Number(order.partners?.current_balance || 0) + Number(order.total_usd);
  await supabase
    .from("partners")
    .update({
      current_balance: newBalance,
      last_order_at: confirmedAt,
    } as any)
    .eq("id", order.partner_id);

  // 4b. Descontar stock de productos vendidos
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, qty")
    .eq("order_id", order.id);

  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      if (!item.product_id) continue;

      // Descontar stock
      const { data: prod } = await supabase
        .from("products")
        .select("stock_qty")
        .eq("id", item.product_id)
        .single();

      const currentStock = Number(prod?.stock_qty ?? 0);
      await supabase
        .from("products")
        .update({ stock_qty: Math.max(0, currentStock - item.qty) } as any)
        .eq("id", item.product_id);

      // Registrar movimiento de inventario
      await supabase.from("stock_movements").insert({
        company_id: order.company_id,
        product_id: item.product_id,
        type: "OUT",
        qty: item.qty,
        reason: `Venta confirmada — Pedido ${order.order_number || order.id}`,
        entity_type: "order",
        entity_id: order.id,
      } as any);
    }
  }

  // 5. Actualizar orden
  await supabase
    .from("orders")
    .update({
      status: "confirmed",
      confirmed_at: confirmedAt,
    } as any)
    .eq("id", order.id);

  // 6. Actividad
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("activity_log").insert({
      company_id: order.company_id,
      entity_type: "order",
      entity_id: order.id,
      user_id: user.id,
      type: "system",
      content: `Pedido confirmado y cuenta por cobrar ${invoiceNumber} generada.`,
    } as any);
  }

  // 7. Revalidar UI
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ventas");
  revalidatePath("/dashboard/cobranza");
  revalidatePath(`/dashboard/ventas/${order.id}`);

  return { success: true };
}
