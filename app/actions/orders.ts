"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getGoldPricePerGram, computeProductPrice } from "@/lib/gold-price";
import { generateOrderCode } from "@/lib/orders";

export async function placeOrderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: { take: 1, select: { id: true } } } } },
  });

  if (items.length === 0) redirect("/cart");

  const goldPrice = await getGoldPricePerGram();
  const note = (formData.get("note") as string | null)?.trim() || null;

  const code = await generateOrderCode();

  let totalGrams = 0;
  let totalWage = 0;
  let totalPrice = 0;

  const orderItems = items.map((item) => {
    const unitPrice = computeProductPrice(item.product.weight, item.product.wage, goldPrice);
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

  const order = await prisma.order.create({
    data: {
      code,
      userId: user.id,
      status: "PENDING",
      totalGrams,
      totalWage,
      goldPrice,
      totalPrice,
      note,
      items: { create: orderItems },
    },
  });

  await prisma.cartItem.deleteMany({ where: { userId: user.id } });

  revalidatePath("/cart");
  revalidatePath("/profile");
  redirect(`/orders/${order.code}`);
}
