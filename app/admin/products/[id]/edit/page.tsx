import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/products";
import { AdminProductForm } from "@/components/admin-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  return { title: product ? `ویرایش ${product.name}` : "ویرایش محصول" };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, images: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } } },
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
