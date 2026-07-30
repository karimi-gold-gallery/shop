import { getCurrentUser } from "@/lib/auth";
import { getGoldPrices, type GoldPriceMap } from "@/lib/gold-prices";

export type ViewerPricing = {
  goldPrices: GoldPriceMap;
  /** Personal discount (0–100 %) of the signed-in customer; 0 for guests/admins. */
  discountPercent: number;
};

export const MAX_DISCOUNT_PERCENT = 100;

export function normalizeDiscountPercent(
  percent: number | null | undefined
): number {
  if (typeof percent !== "number" || !Number.isFinite(percent)) return 0;
  return Math.min(MAX_DISCOUNT_PERCENT, Math.max(0, percent));
}

export function applyDiscount(amount: number, discountPercent: number): number {
  const percent = normalizeDiscountPercent(discountPercent);
  if (percent === 0) return amount;
  return amount * (1 - percent / 100);
}

export function computeProductPrice(
  weight: number,
  wage: number,
  goldPricePerGram: number,
  discountPercent: number = 0
): number {
  return applyDiscount(
    computeBaseProductPrice(weight, wage, goldPricePerGram),
    discountPercent
  );
}

export function computeBaseProductPrice(
  weight: number,
  wage: number,
  goldPricePerGram: number
): number {
  return weight * goldPricePerGram + wage;
}

/** Only customers carry a personal discount — guests and admins always see list prices. */
export function getUserDiscountPercent(
  user: { role: string; discountPercent: number } | null | undefined
): number {
  if (!user || user.role !== "CUSTOMER") return 0;
  return normalizeDiscountPercent(user.discountPercent);
}

/** Gold price plus the discount that applies to whoever is viewing the page. */
export async function getViewerPricing(): Promise<ViewerPricing> {
  const [goldPrices, user] = await Promise.all([
    getGoldPrices(),
    getCurrentUser(),
  ]);
  return { goldPrices, discountPercent: getUserDiscountPercent(user) };
}
