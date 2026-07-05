import { prisma } from "@/lib/prisma";

const ORDER_CODE_PREFIX = "KG";

export async function generateOrderCode(): Promise<string> {
  const count = await prisma.order.count();
  const next = count + 1;
  return `${ORDER_CODE_PREFIX}-${String(100000 + next).slice(0, 6)}`;
}
