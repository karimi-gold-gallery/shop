import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getCategories, productColumns } from "@/lib/products";
import { AdminProductForm } from "@/components/admin-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { name: true },
  });
  return { title: product ? `ویرایش ${product.name}` : "ویرایش محصول" };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: productColumns,
    with: {
      category: true,
      images: {
        columns: { id: true, mimeType: true },
        orderBy: (image, { asc }) => asc(image.createdAt),
      },
    },
  });

  if (!product) notFound();

  const categories = await getCategories();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy">ویرایش محصول</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">اطلاعات محصول</CardTitle>
          <CardDescription>تغییرات را اعمال و ذخیره کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminProductForm categories={categories} product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
