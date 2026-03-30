"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockAdjustmentPayload {
  product_id: string;
  warehouse_id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  qty: number;
  reason: string;
}

export interface StockTransferPayload {
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  qty: number;
  reason?: string;
}

export interface BulkStockUpdateRow {
  sku: string;
  qty: number;
  warehouse_id?: string;
}

// ─── Helper: obtener company_id del usuario autenticado ──────────────────────

async function getCompanyId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("company_id, id")
    .eq("auth_id", user.id)
    .single();

  return data?.company_id ?? null;
}

// ─── Action 1: Ajuste Manual ─────────────────────────────────────────────────

export async function createStockAdjustment(
  payload: StockAdjustmentPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  if (!company_id) return { success: false, error: "No autenticado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    // 1. Obtener stock actual en el depósito
    const { data: currentStock } = await supabase
      .from("warehouse_stock")
      .select("qty")
      .eq("warehouse_id", payload.warehouse_id)
      .eq("product_id", payload.product_id)
      .single();

    const currentQty = currentStock?.qty ?? 0;
    const delta =
      payload.type === "OUT" ? -Math.abs(payload.qty) : Math.abs(payload.qty);
    const newQty = currentQty + delta;

    if (newQty < 0) {
      return { success: false, error: "Stock insuficiente para esta salida." };
    }

    // 2. Upsert en warehouse_stock
    const { error: stockError } = await supabase
      .from("warehouse_stock")
      .upsert(
        {
          warehouse_id: payload.warehouse_id,
          product_id: payload.product_id,
          qty: newQty,
        },
        { onConflict: "warehouse_id,product_id" }
      );

    if (stockError) throw stockError;

    // 3. Actualizar campo stock en products (para stats globales)
    await supabase.rpc("increment_product_stock", {
      p_product_id: payload.product_id,
      p_delta: delta,
    }); // Silencioso si RPC no existe

    // 4. Registrar movimiento
    const { error: movError } = await supabase.from("stock_movements").insert({
      company_id,
      product_id: payload.product_id,
      warehouse_id: payload.warehouse_id,
      type: payload.type,
      qty: payload.qty,
      reason: payload.reason,
      user_id: user?.id,
    });

    if (movError) throw movError;

    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error desconocido." };
  }
}

// ─── Action 2: Transferencia entre Depósitos ─────────────────────────────────

export async function transferStock(
  payload: StockTransferPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  if (!company_id) return { success: false, error: "No autenticado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    // 1. Verificar stock en origen
    const { data: originStock } = await supabase
      .from("warehouse_stock")
      .select("qty")
      .eq("warehouse_id", payload.from_warehouse_id)
      .eq("product_id", payload.product_id)
      .single();

    const originQty = originStock?.qty ?? 0;
    if (originQty < payload.qty) {
      return {
        success: false,
        error: `Stock insuficiente en el depósito origen (hay ${originQty} unidades).`,
      };
    }

    // 2. Restar en origen
    const { error: originError } = await supabase
      .from("warehouse_stock")
      .upsert(
        {
          warehouse_id: payload.from_warehouse_id,
          product_id: payload.product_id,
          qty: originQty - payload.qty,
        },
        { onConflict: "warehouse_id,product_id" }
      );
    if (originError) throw originError;

    // 3. Sumar en destino
    const { data: destStock } = await supabase
      .from("warehouse_stock")
      .select("qty")
      .eq("warehouse_id", payload.to_warehouse_id)
      .eq("product_id", payload.product_id)
      .single();

    const { error: destError } = await supabase
      .from("warehouse_stock")
      .upsert(
        {
          warehouse_id: payload.to_warehouse_id,
          product_id: payload.product_id,
          qty: (destStock?.qty ?? 0) + payload.qty,
        },
        { onConflict: "warehouse_id,product_id" }
      );
    if (destError) throw destError;

    // 4. Registrar movimiento
    const { error: movError } = await supabase.from("stock_movements").insert({
      company_id,
      product_id: payload.product_id,
      warehouse_id: payload.from_warehouse_id,
      from_warehouse_id: payload.from_warehouse_id,
      to_warehouse_id: payload.to_warehouse_id,
      type: "TRANSFER",
      qty: payload.qty,
      reason: payload.reason ?? "Transferencia entre depósitos",
      user_id: user?.id,
    });

    if (movError) throw movError;

    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error desconocido." };
  }
}

// ─── Action 3: Obtener Historial de Movimientos ───────────────────────────────

export async function getStockMovements(filters?: {
  warehouse_id?: string;
  type?: string;
  from?: string;
  to?: string;
}) {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  if (!company_id) return [];

  let query = supabase
    .from("stock_movements")
    .select(
      `
      *,
      products(name, sku),
      warehouses:warehouse_id(name),
      from_warehouse:from_warehouse_id(name),
      to_warehouse:to_warehouse_id(name)
    `
    )
    .eq("company_id", company_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.warehouse_id) query = query.eq("warehouse_id", filters.warehouse_id);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

// ─── Action 4: Carga Masiva de Stock ─────────────────────────────────────────

export async function bulkStockUpdate(
  rows: BulkStockUpdateRow[],
  warehouse_id: string
): Promise<{ success: number; errors: string[] }> {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  if (!company_id) return { success: 0, errors: ["No autenticado."] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let successCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("sku", row.sku.trim().toUpperCase())
        .eq("company_id", company_id)
        .single();

      if (!product) {
        errors.push(`SKU "${row.sku}" no encontrado.`);
        continue;
      }

      await supabase.from("warehouse_stock").upsert(
        { warehouse_id, product_id: product.id, qty: row.qty },
        { onConflict: "warehouse_id,product_id" }
      );

      await supabase.from("stock_movements").insert({
        company_id,
        product_id: product.id,
        warehouse_id,
        type: "ADJUSTMENT",
        qty: row.qty,
        reason: "Carga masiva vía CSV",
        user_id: user?.id,
      });

      successCount++;
    } catch {
      errors.push(`Error al procesar SKU "${row.sku}".`);
    }
  }

  revalidatePath("/dashboard/inventario");
  return { success: successCount, errors };
}
