"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";

import { countRows, db } from "@/lib/db";
import {
  cartItems,
  categories,
  orders,
  productImages,
  products,
  sessions,
  users,
  type NewProductImage,
  type NewUser,
} from "@/lib/db/schema";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import {
  categorySchema,
  productSchema,
  orderStatusSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
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
    await db
      .insert(categories)
      .values({ name, slug, description: parsed.data.description || null });
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
    const updated = await db
      .update(categories)
      .set({
        name: parsed.data.name,
        description: parsed.data.description || null,
      })
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (updated.length === 0) return { error: "به‌روزرسانی ناموفق بود" };
  } catch {
    return { error: "به‌روزرسانی ناموفق بود" };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: "دسته‌بندی به‌روز شد" };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  const count = await countRows(products, eq(products.categoryId, id));
  if (count > 0) {
    throw new Error("این دسته دارای محصول است و قابل حذف نیست");
  }
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

/* ----------------------------- Products ----------------------------- */

type NewImage = Omit<NewProductImage, "productId">;

async function readImages(formData: FormData): Promise<NewImage[]> {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const images: NewImage[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
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
    karat: formData.get("karat"),
    wage: formData.get("wage"),
    categoryId: formData.get("categoryId"),
    active: formData.get("active") === "on" ? true : false,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const slug = slugify(parsed.data.name);
  const images = await readImages(formData);
  if (images.length === 0) {
    return { error: "حداقل یک تصویر برای محصول الزامی است" };
  }

  try {
    await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          weight: parsed.data.weight,
          karat: parsed.data.karat,
          wage: parsed.data.wage,
          categoryId: parsed.data.categoryId,
          active: parsed.data.active,
        })
        .returning({ id: products.id });

      await tx
        .insert(productImages)
        .values(images.map((image) => ({ ...image, productId: product!.id })));
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
    karat: formData.get("karat"),
    wage: formData.get("wage"),
    categoryId: formData.get("categoryId"),
    active: formData.get("active") === "on" ? true : false,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const images = await readImages(formData);
  const existingImageCount = await countRows(productImages, eq(productImages.productId, id));
  if (existingImageCount === 0 && images.length === 0) {
    return { error: "حداقل یک تصویر برای محصول الزامی است" };
  }

  try {
    const ok = await db.transaction(async (tx) => {
      const updated = await tx
        .update(products)
        .set({
          name: parsed.data.name,
          description: parsed.data.description || null,
          weight: parsed.data.weight,
          karat: parsed.data.karat,
          wage: parsed.data.wage,
          categoryId: parsed.data.categoryId,
          active: parsed.data.active,
        })
        .where(eq(products.id, id))
        .returning({ id: products.id });

      if (updated.length === 0) return false;

      if (images.length > 0) {
        await tx
          .insert(productImages)
          .values(images.map((image) => ({ ...image, productId: id })));
      }
      return true;
    });
    if (!ok) return { error: "به‌روزرسانی محصول ناموفق بود" };
  } catch {
    return { error: "به‌روزرسانی محصول ناموفق بود" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products`);
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteProductImageAction(
  imageId: string
): Promise<ActionState> {
  await requireAdmin();

  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, imageId),
    columns: { id: true, productId: true },
  });
  if (!image) return { error: "تصویر یافت نشد" };

  const imageCount = await countRows(
    productImages,
    eq(productImages.productId, image.productId)
  );
  if (imageCount <= 1) {
    return { error: "حداقل یک تصویر برای محصول الزامی است" };
  }

  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath("/admin/products");
  return { success: "تصویر حذف شد" };
}

/* ----------------------------- Orders ----------------------------- */

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<void> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("وضعیت نامعتبر");

  await db
    .update(orders)
    .set({ status: parsed.data })
    .where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/orders`);
}

export async function deleteOrderAction(orderId: string): Promise<void> {
  await requireAdmin();
  await db.delete(orders).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
}

/* ----------------------------- Users ----------------------------- */

export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    city: formData.get("city"),
    discountPercent: formData.get("discountPercent"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existing = await db.query.users.findFirst({
    where: eq(users.username, parsed.data.username),
    columns: { id: true },
  });
  if (existing) return { error: "این نام کاربری قبلاً ثبت شده است" };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(users).values({
    username: parsed.data.username,
    passwordHash,
    role: "CUSTOMER",
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    gender: parsed.data.gender,
    birthDate: parsed.data.birthDate,
    city: parsed.data.city || null,
    discountPercent: parsed.data.discountPercent,
    onboarded: true,
  });

  revalidatePath("/admin/users");
  return { success: "کاربر ایجاد شد" };
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminUpdateUserSchema.safeParse({
    id: formData.get("id"),
    username: formData.get("username"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    city: formData.get("city"),
    address: formData.get("address"),
    nationalCode: formData.get("nationalCode"),
    postalCode: formData.get("postalCode"),
    discountPercent: formData.get("discountPercent"),
    onboarded: formData.get("onboarded") === "on" || formData.get("onboarded") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const user = await db.query.users.findFirst({
    where: eq(users.id, parsed.data.id),
    columns: { id: true, role: true },
  });
  if (!user || user.role !== "CUSTOMER") {
    return { error: "کاربر یافت نشد" };
  }

  const usernameTaken = await db.query.users.findFirst({
    where: and(
      eq(users.username, parsed.data.username),
      ne(users.id, parsed.data.id)
    ),
    columns: { id: true },
  });
  if (usernameTaken) return { error: "این نام کاربری قبلاً ثبت شده است" };

  const data: Partial<NewUser> = {
    username: parsed.data.username,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    gender: parsed.data.gender,
    birthDate: parsed.data.birthDate,
    city: parsed.data.city || null,
    address: parsed.data.address || null,
    nationalCode: parsed.data.nationalCode || null,
    postalCode: parsed.data.postalCode || null,
    discountPercent: parsed.data.discountPercent,
    onboarded: parsed.data.onboarded ?? true,
  };

  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  try {
    const updated = await db
      .update(users)
      .set(data)
      .where(eq(users.id, parsed.data.id))
      .returning({ id: users.id });
    if (updated.length === 0) return { error: "به‌روزرسانی کاربر ناموفق بود" };
  } catch {
    return { error: "به‌روزرسانی کاربر ناموفق بود" };
  }

  revalidatePath("/admin/users");
  // Prices are personalised, so every price-bearing page for this customer is stale.
  revalidatePath("/", "layout");
  return { success: "کاربر به‌روز شد" };
}

export async function deleteUserAction(id: string): Promise<void> {
  await requireAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, role: true },
  });
  if (!user || user.role !== "CUSTOMER") {
    throw new Error("کاربر یافت نشد");
  }

  const orderCount = await countRows(orders, eq(orders.userId, id));
  if (orderCount > 0) {
    throw new Error("این کاربر سفارش دارد و قابل حذف نیست");
  }

  // Sessions and cart items cascade on delete, but we clear them explicitly so
  // the whole removal stays a single atomic step.
  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.delete(cartItems).where(eq(cartItems.userId, id));
    await tx.delete(users).where(eq(users.id, id));
  });

  revalidatePath("/admin/users");
}
