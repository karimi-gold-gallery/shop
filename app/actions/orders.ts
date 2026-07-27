"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems, orderItems, orders } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getGoldPricePerGram, computeProductPrice } from "@/lib/gold-price";
import { getUserDiscountPercent } from "@/lib/pricing";
import { generateOrderCode } from "@/lib/orders";

export async function placeOrderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, user.id),
    with: {
      product: {
        with: { images: { columns: { id: true }, limit: 1 } },
      },
    },
    orderBy: desc(cartItems.createdAt),
  });

  if (items.length === 0) redirect("/cart");

  const goldPrice = await getGoldPricePerGram();
  const discountPercent = getUserDiscountPercent(user);
  const note = (formData.get("note") as string | null)?.trim() || null;

  const code = await generateOrderCode();

  let totalGrams = 0;
  let totalWage = 0;
  let totalPrice = 0;

  const lines = items.map((item) => {
    const unitPrice = computeProductPrice(
      item.product.weight,
      item.product.wage,
      goldPrice,
      discountPercent
    );
    const lineTotal = unitPrice * item.quantity;
    totalGrams += item.product.weight * item.quantity;
    totalWage += item.product.wage * item.quantity;
    totalPrice += lineTotal;
    return {
      productId: item.product.id,
      name: item.product.name,
      weight: item.product.weight,
      wage: item.product.wage,
      goldPrice,
      unitPrice,
      quantity: item.quantity,
      imageId: item.product.images[0]?.id ?? null,
    };
  });

  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        code,
        userId: user.id,
        status: "PENDING",
        totalGrams,
        totalWage,
        goldPrice,
        discountPercent,
        totalPrice,
        note,
      })
      .returning({ id: orders.id, code: orders.code });

    await tx
      .insert(orderItems)
      .values(lines.map((line) => ({ ...line, orderId: created!.id })));

    await tx.delete(cartItems).where(eq(cartItems.userId, user.id));

    return created!;
  });

  revalidatePath("/cart");
  revalidatePath("/profile");
  redirect(`/orders/${order.code}`);
}
