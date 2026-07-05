import Link from "next/link";
import type { Metadata } from "next";
import { UserCircle, ShoppingBag } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toPersianDigits, formatToman, formatDateJalali } from "@/lib/format";
import { ProfileForm } from "@/components/profile-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "پروفایل من" };

const STATUS_LABEL: Record<string, { label: string; variant: "gold" | "success" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار تماس", variant: "gold" },
  PAID: { label: "پرداخت‌شده", variant: "secondary" },
  FINISHED: { label: "تکمیل شده", variant: "success" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
};

type SearchParams = Promise<{ tab?: string }>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-navy mb-2">برای مشاهده پروفایل وارد شوید</h1>
        <Button asChild variant="navy" className="mt-4"><Link href="/login">ورود / ثبت‌نام</Link></Button>
      </div>
    );
  }

  const { tab } = await searchParams;
  const activeTab = tab === "orders" ? "orders" : "profile";

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, totalPrice: true, createdAt: true, _count: { select: { items: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
          <UserCircle className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-navy">
            {user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        <TabLink active={activeTab === "profile"} href="/profile">اطلاعات پروفایل</TabLink>
        <TabLink active={activeTab === "orders"} href="/profile?tab=orders">سفارش‌های من</TabLink>
      </div>

      {activeTab === "profile" ? (
        <Card className="p-6">
          <h2 className="font-bold text-navy mb-1">اطلاعات شخصی</h2>
          <p className="text-sm text-muted-foreground mb-5">اطلاعات خود را بررسی و به‌روز کنید.</p>
          <ProfileForm user={user} />
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <Card className="p-10 text-center">
              <ShoppingBag className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-navy">هنوز سفارشی ثبت نکرده‌اید</p>
              <Button asChild variant="gold" className="mt-4"><Link href="/products">شروع خرید</Link></Button>
            </Card>
          ) : (
            orders.map((order) => {
              const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
              return (
                <Link key={order.id} href={`/orders/${order.code}`}>
                  <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-bold text-navy" dir="ltr">{toPersianDigits(order.code)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {toPersianDigits(formatDateJalali(order.createdAt))} • {toPersianDigits(order._count.items)} قلم
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="font-bold text-navy">{toPersianDigits(formatToman(order.totalPrice))}</span>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}
    >
      {children}
    </Link>
  );
}
