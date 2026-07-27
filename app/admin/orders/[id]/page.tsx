import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, User, Phone, MapPin } from "lucide-react";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  toPersianDigits,
  formatToman,
  formatGram,
  formatPercent,
  formatDateJalali,
} from "@/lib/format";
import { OrderActions } from "@/components/admin-order-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, { label: string; variant: "gold" | "success" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار تماس", variant: "gold" },
  PAID: { label: "پرداخت‌شده", variant: "secondary" },
  FINISHED: { label: "تکمیل شده", variant: "success" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    columns: { code: true },
  });
  return { title: order ? `سفارش ${order.code}` : "سفارش" };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      user: true,
      items: true,
    },
  });

  if (!order) notFound();
  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
  const customer = order.user;
  const basePrice = order.totalGrams * order.goldPrice + order.totalWage;

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/admin/orders">
            <ChevronLeft className="size-4" />
            بازگشت به سفارش‌ها
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-navy" dir="ltr">{toPersianDigits(order.code)}</h1>
            <p className="text-sm text-muted-foreground">{toPersianDigits(formatDateJalali(order.createdAt))}</p>
          </div>
          <Badge variant={status.variant} className="text-sm">{status.label}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">اقلام سفارش</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {item.imageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/images/${item.imageId}`} alt="" className="size-12 rounded-md object-cover border border-border" />
                    ) : null}
                    <div>
                      <p className="font-medium text-navy">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {toPersianDigits(item.quantity)} عدد • وزن {toPersianDigits(formatGram(item.weight))}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-navy">{toPersianDigits(formatToman(item.unitPrice * item.quantity))}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">مجموع وزن طلا</span><span className="font-medium">{toPersianDigits(formatGram(order.totalGrams))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">مجموع اجرت</span><span className="font-medium">{toPersianDigits(formatToman(order.totalWage))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">قیمت هر گرم طلا (زمان ثبت)</span><span className="font-medium">{toPersianDigits(formatToman(order.goldPrice))}</span></div>
              {order.discountPercent > 0 && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">جمع بدون تخفیف</span><span className="font-medium">{toPersianDigits(formatToman(basePrice))}</span></div>
                  <div className="flex justify-between text-emerald-700">
                    <span>تخفیف مشتری ({toPersianDigits(formatPercent(order.discountPercent))}٪)</span>
                    <span className="font-medium">− {toPersianDigits(formatToman(basePrice - order.totalPrice))}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base"><span className="font-bold text-navy">مبلغ کل</span><span className="font-extrabold text-navy">{toPersianDigits(formatToman(order.totalPrice))}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2"><User className="size-4" /> مشتری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Info label="نام" value={customer.firstName ? `${customer.firstName} ${customer.lastName ?? ""}` : customer.username} />
              <Info label="نام کاربری" value={`@${customer.username}`} />
              {customer.phone && <Info label="موبایل" value={toPersianDigits(customer.phone)} icon={<Phone className="size-3.5" />} />}
              {customer.city && <Info label="شهر" value={customer.city} />}
              {customer.address && <Info label="آدرس" value={customer.address} icon={<MapPin className="size-3.5" />} />}
            </CardContent>
          </Card>

          {order.note && (
            <Card>
              <CardHeader><CardTitle className="text-navy text-sm">یادداشت مشتری</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-6">{order.note}</p></CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-navy mb-3">مدیریت وضعیت سفارش</h2>
        <OrderActions orderId={order.id} currentStatus={order.status} />
      </Card>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className="font-medium text-navy text-left" dir="auto">{value}</span>
    </div>
  );
}
