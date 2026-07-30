import { NextResponse } from "next/server";

import { fetchTgjuMarketPrices } from "@/lib/tgju-gold-prices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prices = await fetchTgjuMarketPrices();
    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to fetch TGJU market prices", error);
    return NextResponse.json(
      { error: "Unable to fetch market prices" },
      { status: 502 }
    );
  }
}
