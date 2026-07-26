import { getCurrentUser } from "@/lib/auth";
import { getGoldPricePerGram, normalizeDiscountPercent } from "@/lib/gold-price";

export type ViewerPricing = {
  goldPrice: number;
  /** Personal discount (0–100 %) of the signed-in customer; 0 for guests/admins. */
  discountPercent: number;
};

/** Only customers carry a personal discount — guests and admins always see list prices. */
export function getUserDiscountPercent(
  user: { role: string; discountPercent: number } | null | undefined
): number {
  if (!user || user.role !== "CUSTOMER") return 0;
  return normalizeDiscountPercent(user.discountPercent);
}

/** Gold price plus the discount that applies to whoever is viewing the page. */
export async function getViewerPricing(): Promise<ViewerPricing> {
  const [goldPrice, user] = await Promise.all([
    getGoldPricePerGram(),
    getCurrentUser(),
  ]);
  return { goldPrice, discountPercent: getUserDiscountPercent(user) };
}
