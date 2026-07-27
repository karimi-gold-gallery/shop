"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type AddToCartResult = { status: "ok" } | { status: "login" };

export async function addToCartAction(productId: string): Promise<AddToCartResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "login" };

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true, active: true },
  });
  if (!product || !product.active) return { status: "ok" };

  // The (userId, productId) unique index makes this an atomic "add one".
  await db
    .insert(cartItems)
    .values({ userId: user.id, productId })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: { quantity: sql`${cartItems.quantity} + 1` },
    });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { status: "ok" };
}

export async function updateCartQuantityAction(
  itemId: string,
  quantity: number
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const where = and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id));

  if (quantity <= 0) {
    await db.delete(cartItems).where(where);
  } else {
    await db.update(cartItems).set({ quantity }).where(where);
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeFromCartAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function clearCartAction(userId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
