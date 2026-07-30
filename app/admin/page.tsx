import Link from "next/link";
import { Package, FolderTree, ClipboardList, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { eq, inArray, sql } from "drizzle-orm";

import { countRows, db } from "@/lib/db";
import { categories, orders, products } from "@/lib/db/schema";
import { getGoldPriceRows } from "@/lib/gold-prices";
import { toPersianDigits, formatToman } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "داشبورد مدیریت" };

export default async function AdminDashboard() {
  const [productCount, categoryCount, orderCount, pendingOrders, paidOrders, revenueRows, goldPriceRows] = await Promise.all([
    countRows(products),
    countRows(categories),
    countRows(orders),
    countRows(orders, eq(orders.status, "PENDING")),
    countRows(orders, eq(orders.status, "PAID")),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.totalPrice}), 0)` })
      .from(orders)
      .where(inArray(orders.status, ["PAID", "FINISHED"])),
    getGoldPriceRows(),
  ]);

  const revenue = Number(revenueRows[0]?.total ?? 0);

  const stats = [
    { label: "محصولات", value: toPersianDigits(productCount), icon: Package, href: "/admin/products" },
    { label: "دسته‌بندی‌ها", value: toPersianDigits(categoryCount), icon: FolderTree, href: "/admin/categories" },
    { label: "کل سفارش‌ها", value: toPersianDigits(orderCount), icon: ClipboardList, href: "/admin/orders" },
    { label: "سفارش‌های در انتظار", value: toPersianDigits(pendingOrders), icon: Clock, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">داشبورد</h1>
        <p className="text-sm text-muted-foreground">نمای کلی از وضعیت گالری کریمی</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold text-navy">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <TrendingUp className="size-5 text-primary" />
              قیمت روز طلا
            </CardTitle>
            <CardDescription>
              قیمت‌ها هر ۳۰ ثانیه از TGJU دریافت و به تومان ذخیره می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goldPriceRows.map((row) => (
                <div key={row.karat} className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      طلای {toPersianDigits(row.karat)} عیار
                    </span>
                    <span className="font-bold text-navy">
                      {toPersianDigits(formatToman(row.pricePerGram))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    زمان منبع: {toPersianDigits(row.sourceTime)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <CheckCircle2 className="size-5 text-emerald-600" />
              وضعیت سفارش‌ها
            </CardTitle>
            <CardDescription>خلاصه سفارش‌ها و درآمد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <span className="text-sm text-muted-foreground">سفارش‌های در انتظار تماس</span>
              <span className="font-bold text-navy">{toPersianDigits(pendingOrders)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <span className="text-sm text-muted-foreground">سفارش‌های پرداخت‌شده</span>
              <span className="font-bold text-navy">{toPersianDigits(paidOrders)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <span className="text-sm text-emerald-700">درآمد تسویه‌شده</span>
              <span className="font-bold text-emerald-700">{toPersianDigits(formatToman(revenue))}</span>
            </div>
            <Button asChild variant="navy" className="w-full">
              <Link href="/admin/orders">مدیریت سفارش‌ها</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
