import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { goldPrices } from "@/lib/db/schema";
import { fetchTgjuKaratPrices } from "@/lib/tgju-gold-prices";

export const GOLD_KARATS = [18, 24] as const;
export type GoldKarat = (typeof GOLD_KARATS)[number];
export type GoldPriceMap = Record<GoldKarat, number>;

export function isGoldKarat(value: number): value is GoldKarat {
  return value === 18 || value === 24;
}

export function goldPriceForKarat(
  prices: GoldPriceMap,
  karat: number
): number {
  if (!isGoldKarat(karat)) {
    throw new Error(`Unsupported gold karat: ${karat}`);
  }
  return prices[karat];
}

export async function syncGoldPrices(): Promise<GoldPriceMap> {
  const live = await fetchTgjuKaratPrices();
  const syncedAt = new Date();
  const rows = GOLD_KARATS.map((karat) => ({
    karat,
    pricePerGram: Math.round(live[karat].livePriceRial / 10),
    sourcePriceRial: live[karat].livePriceRial,
    sourceTime: live[karat].sourceTime,
    syncedAt,
  }));

  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(goldPrices)
        .values(row)
        .onConflictDoUpdate({
          target: goldPrices.karat,
          set: {
            pricePerGram: row.pricePerGram,
            sourcePriceRial: row.sourcePriceRial,
            sourceTime: row.sourceTime,
            syncedAt,
          },
        });
    }
  });

  return {
    18: rows[0].pricePerGram,
    24: rows[1].pricePerGram,
  };
}

export async function getGoldPriceRows() {
  let rows = await db.query.goldPrices.findMany({
    orderBy: asc(goldPrices.karat),
  });

  if (rows.length !== GOLD_KARATS.length) {
    await syncGoldPrices();
    rows = await db.query.goldPrices.findMany({
      orderBy: asc(goldPrices.karat),
    });
  }

  return rows;
}

export async function getGoldPrices(): Promise<GoldPriceMap> {
  const rows = await getGoldPriceRows();
  const byKarat = new Map(rows.map((row) => [row.karat, row.pricePerGram]));
  const gold18 = byKarat.get(18);
  const gold24 = byKarat.get(24);

  if (!gold18 || !gold24) {
    throw new Error("Gold prices are not available");
  }

  return { 18: gold18, 24: gold24 };
}
