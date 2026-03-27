/**
 * Calculates the prorated freight for each item in a purchase.
 * Strategy: Ratio based on line subtotal.
 * Formula: (line_subtotal / total_subtotal) * total_freight
 * 
 * @param items List of purchase items with their individual costs and quantities.
 * @param totalFreight Total freight amount to be distributed.
 */
export function calculateProratedCosts<T extends { qty: number; unit_cost_usd: number }>(
  items: T[],
  totalFreight: number
) {
  const totalSubtotal = items.reduce(
    (acc, item) => acc + item.unit_cost_usd * item.qty,
    0
  );

  if (totalSubtotal === 0) {
    return items.map((i) => ({
      ...i,
      prorated_freight_usd: 0,
      total_unit_cost_usd: i.unit_cost_usd,
      subtotal_usd: i.unit_cost_usd * i.qty,
    }));
  }

  return items.map((item) => {
    const itemSubtotal = item.unit_cost_usd * item.qty;
    const proratedFreightForLine = (itemSubtotal / totalSubtotal) * totalFreight;
    const proratedFreightPerUnit = proratedFreightForLine / item.qty;

    return {
      ...item,
      prorated_freight_usd: proratedFreightForLine,
      total_unit_cost_usd: item.unit_cost_usd + proratedFreightPerUnit,
      subtotal_usd: itemSubtotal,
    };
  });
}

/**
 * Calculates the commission for a single sale item based on user rules.
 * Hierarchy: Brand Match > Department Match > Price Level Match > Global Default.
 */
export function calculateItemCommission(
  item: { brand?: string; department?: string; price_level?: string; subtotal_usd: number },
  rules: any[]
): { percentage: number; amount: number; trigger: "sale" | "collection" } {
  if (!rules || rules.length === 0) return { percentage: 0, amount: 0, trigger: "sale" };

  // 1. Precise Brand Match
  let match = rules.find(r => r.type === "brand" && r.value.toLowerCase() === item.brand?.toLowerCase());
  
  // 2. Department Match
  if (!match) {
    match = rules.find(r => r.type === "department" && r.value.toLowerCase() === item.department?.toLowerCase());
  }

  // 3. Price Level Match
  if (!match) {
    match = rules.find(r => r.type === "price_level" && r.value === item.price_level);
  }

  // 4. Global Default
  if (!match) {
    match = rules.find(r => r.type === "global");
  }

  if (match) {
    return {
      percentage: match.percentage,
      amount: (item.subtotal_usd * match.percentage) / 100,
      trigger: match.condition || "sale"
    };
  }

  return { percentage: 0, amount: 0, trigger: "sale" };
}

/**
 * Calculates commissions for a specific sale based on seller rules.
 * Supports Brand, Department, and Price Type filtering.
 */
export function calculateCommissions(
  saleItems: { product_id: string; brand: string; department: string; price_type: string; total_usd: number }[],
  commissionRules: {
    brand?: string;
    department?: string;
    price_type?: string;
    percentage: number;
  }[]
) {
  return saleItems.map((item) => {
    // Find matching rule (most specific first)
    const rule = commissionRules.find(
      (r) =>
        (!r.brand || r.brand === item.brand) &&
        (!r.department || r.department === item.department) &&
        (!r.price_type || r.price_type === item.price_type)
    ) || { percentage: 0 };

    return {
      ...item,
      commission_amount_usd: (item.total_usd * rule.percentage) / 100,
      rule_applied: rule,
    };
  });
}
