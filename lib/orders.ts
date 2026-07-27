import { count, inArray } from "drizzle-orm";

import { countRows, db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";

const ORDER_CODE_PREFIX = "KG";

export async function generateOrderCode(): Promise<string> {
  const total = await countRows(orders);
  const next = total + 1;
  return `${ORDER_CODE_PREFIX}-${String(100000 + next).slice(0, 6)}`;
}

/** Number of line items per order, for order lists that only show a count. */
export async function getOrderItemCounts(
  orderIds: string[]
): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();

  const rows = await db
    .select({ orderId: orderItems.orderId, value: count() })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
    .groupBy(orderItems.orderId);

  return new Map(rows.map((row) => [row.orderId, row.value]));
}
