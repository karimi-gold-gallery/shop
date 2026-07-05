import type { Metadata } from "next";

import { getCategories } from "@/lib/products";
import { AdminProductForm } from "@/components/admin-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "محصول جدید" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy">افزودن محصول جدید</h1>
        <p className="text-sm text-muted-foreground">اطلاعات محصول و تصاویر آن را وارد کنید.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">اطلاعات محصول</CardTitle>
          <CardDescription>قیمت محصول بر اساس وزن، اجرت و قیمت روز طلا محاسبه می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
