/**
 * Lumis subscription plan pricing — single source of truth.
 * Used in all superadmin financial calculations and reports.
 */
export const PLAN_PRICES: Record<string, number> = {
  basic: 19.99,
  starter: 19.99,
  pro: 79.99,
  enterprise: 119.99,
};

/** Subscription statuses that represent a paying customer (not demo/trial) */
export const PAYING_STATUSES = ["active", "suspended"] as const;

/** Subscription status that should be excluded from financial reporting */
export const DEMO_STATUS = "demo" as const;
