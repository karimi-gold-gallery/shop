import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { syncGoldPrices } from "@/lib/gold-prices";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Gold price sync is not configured" },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prices = await syncGoldPrices();
    return NextResponse.json(
      { prices, syncedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to synchronize TGJU gold prices", error);
    return NextResponse.json(
      { error: "Unable to synchronize gold prices" },
      { status: 502 }
    );
  }
}
