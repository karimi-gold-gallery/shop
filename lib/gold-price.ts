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

/** Product unit price = weight (g) * gold price per gram + wage (making charge). */
export function computeProductPrice(
  weight: number,
  wage: number,
  goldPricePerGram: number
): number {
  return weight * goldPricePerGram + wage;
}
