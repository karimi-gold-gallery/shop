import { prisma } from "@/lib/prisma";

export const GOLD_PRICE_SETTING_KEY = "goldPricePerGram";

/** Mock gold price per gram in Toman. Will later be updated via an API/cron job. */
export const DEFAULT_GOLD_PRICE_PER_GRAM = 4_500_000;

export async function getGoldPricePerGram(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: GOLD_PRICE_SETTING_KEY },
  });
  const value = Number(setting?.value);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_GOLD_PRICE_PER_GRAM;
}

export async function setGoldPricePerGram(price: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: GOLD_PRICE_SETTING_KEY },
    update: { value: String(price) },
    create: { key: GOLD_PRICE_SETTING_KEY, value: String(price) },
  });
}

export const MAX_DISCOUNT_PERCENT = 100;

/** Clamps a stored/user-supplied discount to a usable 0–100 range. */
export function normalizeDiscountPercent(percent: number | null | undefined): number {
  if (typeof percent !== "number" || !Number.isFinite(percent)) return 0;
  return Math.min(MAX_DISCOUNT_PERCENT, Math.max(0, percent));
}

/** Applies a customer's personal discount to an amount in Toman. */
export function applyDiscount(amount: number, discountPercent: number): number {
  const percent = normalizeDiscountPercent(discountPercent);
  if (percent === 0) return amount;
  return amount * (1 - percent / 100);
}

/**
 * Product unit price = weight (g) * gold price per gram + wage (making charge),
 * minus the customer's personal discount.
 */
export function computeProductPrice(
  weight: number,
  wage: number,
  goldPricePerGram: number,
  discountPercent: number = 0
): number {
  return applyDiscount(weight * goldPricePerGram + wage, discountPercent);
}

/** Price before the personal discount — used to show the crossed-out amount. */
export function computeBaseProductPrice(
  weight: number,
  wage: number,
  goldPricePerGram: number
): number {
  return weight * goldPricePerGram + wage;
}
