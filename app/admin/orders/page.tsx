import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toPersianDigits, formatToman, formatDateJalali } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "مدیریت سفارش‌ها" };

const STATUS_LABEL: Record<string, { label: string; variant: "gold" | "success" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار تماس", variant: "gold" },
  PAID: { label: "پرداخت‌شده", variant: "secondary" },
  FINISHED: { label: "تکمیل شده", variant: "success" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, username: true, phone: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">مدیریت سفارش‌ها</h1>
        <p className="text-sm text-muted-foreground">{toPersianDigits(orders.length)} سفارش</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>کد سفارش</TableHead>
              <TableHead>مشتری</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>تعداد قلم</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">سفارشی ثبت نشده است.</TableCell>
              </TableRow>
            )}
            {orders.map((o) => {
              const status = STATUS_LABEL[o.status] ?? STATUS_LABEL.PENDING;
              const name = o.user.firstName ? `${o.user.firstName} ${o.user.lastName ?? ""}` : o.user.username;
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-bold text-navy" dir="ltr">{toPersianDigits(o.code)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{name}</span>
                      {o.user.phone && <span className="text-xs text-muted-foreground" dir="ltr">{toPersianDigits(o.user.phone)}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{toPersianDigits(formatDateJalali(o.createdAt))}</TableCell>
                  <TableCell>{toPersianDigits(o._count.items)}</TableCell>
                  <TableCell className="font-semibold text-navy">{toPersianDigits(formatToman(o.totalPrice))}</TableCell>
                  <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${o.id}`}>
                        جزئیات
                        <ChevronLeft className="size-4" />
                      </Link>
                    </Button>
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
