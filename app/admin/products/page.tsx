import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getGoldPricePerGram, computeProductPrice } from "@/lib/gold-price";
import { toPersianDigits, formatToman, formatGram } from "@/lib/format";
import { DeleteProductButton } from "@/components/delete-product-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "مدیریت محصولات" };

export default async function AdminProductsPage() {
  const [products, goldPrice] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, images: { take: 1, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getGoldPricePerGram(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">مدیریت محصولات</h1>
          <p className="text-sm text-muted-foreground">{toPersianDigits(products.length)} محصول</p>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>محصول</TableHead>
              <TableHead>دسته</TableHead>
              <TableHead>وزن</TableHead>
              <TableHead>قیمت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const price = computeProductPrice(p.weight, p.wage, goldPrice);
              const img = p.images[0];
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-md bg-secondary/50">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/images/${img.id}`} alt="" className="size-full object-cover" />
                        ) : null}
                      </div>
                      <span className="font-medium text-navy line-clamp-1 max-w-[200px]">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{p.category.name}</Badge></TableCell>
                  <TableCell>{toPersianDigits(formatGram(p.weight))}</TableCell>
                  <TableCell className="font-semibold text-navy">{toPersianDigits(formatToman(price))}</TableCell>
                  <TableCell>
                    {p.active ? <Badge variant="success">فعال</Badge> : <Badge variant="outline">غیرفعال</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link href={`/admin/products/${p.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
