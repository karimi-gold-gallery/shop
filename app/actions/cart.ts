"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type AddToCartResult = { status: "ok" } | { status: "login" };

export async function addToCartAction(productId: string): Promise<AddToCartResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "login" };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) return { status: "ok" };

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + 1 },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: user.id, productId },
    });
  }

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

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeFromCartAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return;

  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function clearCartAction(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
