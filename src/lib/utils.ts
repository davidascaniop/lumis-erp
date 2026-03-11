import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null,
  symbol: string = "$",
) {
  const value = Number(amount) || 0;
  return `${symbol}${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatNumber(amount: number | string | null) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
