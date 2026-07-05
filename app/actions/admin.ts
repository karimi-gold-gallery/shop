"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { setGoldPricePerGram } from "@/lib/gold-price";
import { slugify } from "@/lib/slug";
import {
  categorySchema,
  productSchema,
  goldPriceSchema,
  orderStatusSchema,
} from "@/lib/schemas";

export type ActionState = { error?: string; success?: string } | undefined;

/* ----------------------------- Categories ----------------------------- */

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const name = parsed.data.name;
  const slug = slugify(name);
  try {
    await prisma.category.create({
      data: { name, slug, description: parsed.data.description || null },
    });
  } catch {
    return { error: "این دسته‌بندی قبلاً وجود دارد" };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: "دسته‌بندی ایجاد شد" };
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch {
    return { error: "به‌روزرسانی ناموفق بود" };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: "دسته‌بندی به‌روز شد" };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error("این دسته دارای محصول است و قابل حذف نیست");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

/* ----------------------------- Products ----------------------------- */

async function readImages(formData: FormData): Promise<Prisma.ProductImageCreateWithoutProductInput[]> {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const images: Prisma.ProductImageCreateWithoutProductInput[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    images.push({
      data: bytes,
      mimeType: file.type || "image/png",
    });
  }
  return images;
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    weight: formData.get("weight"),
    wage: formData.get("wage"),
    categoryId: formData.get("categoryId"),
    active: formData.get("active") === "on" ? true : false,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const slug = slugify(parsed.data.name);
  const images = await readImages(formData);

  try {
    await prisma.product.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        weight: parsed.data.weight,
        wage: parsed.data.wage,
        categoryId: parsed.data.categoryId,
        active: parsed.data.active,
        images: { create: images },
      },
    });
  } catch {
    return { error: "ایجاد محصول ناموفق بود" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    weight: formData.get("weight"),
    wage: formData.get("wage"),
    categoryId: formData.get("categoryId"),
    active: formData.get("active") === "on" ? true : false,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const images = await readImages(formData);

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        weight: parsed.data.weight,
        wage: parsed.data.wage,
        categoryId: parsed.data.categoryId,
        active: parsed.data.active,
        ...(images.length > 0 ? { images: { create: images } } : {}),
      },
    });
  } catch {
    return { error: "به‌روزرسانی محصول ناموفق بود" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products`);
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteProductImageAction(imageId: string): Promise<void> {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath("/admin/products");
}

/* ----------------------------- Orders ----------------------------- */

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<void> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("وضعیت نامعتبر");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/orders`);
}

export async function deleteOrderAction(orderId: string): Promise<void> {
  await requireAdmin();
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/admin/orders");
}

/* ----------------------------- Settings ----------------------------- */

export async function updateGoldPriceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = goldPriceSchema.safeParse({ price: formData.get("price") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await setGoldPricePerGram(parsed.data.price);
  revalidatePath("/", "layout");
  return { success: "قیمت طلا به‌روز شد" };
}
