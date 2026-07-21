import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  ShoppingBag,
  UserCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toPersianDigits, formatToman, formatDateJalali } from "@/lib/format";
import { ProfileForm } from "@/components/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "پروفایل من" };

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "gold" | "success" | "secondary" | "destructive" }
> = {
  PENDING: { label: "در انتظار تماس", variant: "gold" },
  PAID: { label: "پرداخت‌شده", variant: "secondary" },
  FINISHED: { label: "تکمیل شده", variant: "success" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
};

type SearchParams = Promise<{ tab?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="beige-texture flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-navy text-gold shadow-md ring-1 ring-gold/30">
            <UserCircle className="size-8" />
          </span>
          <h1 className="text-xl font-bold text-navy">برای مشاهده پروفایل وارد شوید</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-7">
            با ورود می‌توانید اطلاعات شخصی و سفارش‌های خود را مدیریت کنید.
          </p>
          <Button asChild variant="navy" className="mt-5">
            <Link href="/login">ورود / ثبت‌نام</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { tab } = await searchParams;
  const activeTab = tab === "orders" ? "orders" : "profile";

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.username;

  return (
    <div className="beige-texture relative flex-1">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(201,161,74,0.18), transparent 55%), radial-gradient(ellipse 40% 35% at 0% 100%, rgba(1,3,78,0.06), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-gold shadow-md ring-1 ring-gold/30 sm:size-16">
              <UserCircle className="size-8 sm:size-9" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">حساب کاربری</p>
              <h1 className="text-xl font-extrabold text-navy sm:text-2xl">{displayName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                @{user.username}
              </p>
            </div>
          </div>

          {activeTab === "orders" && orders.length > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <Package className="size-4 text-gold" />
              <span className="text-sm text-muted-foreground">تعداد سفارش‌ها:</span>
              <span className="font-bold text-navy">{toPersianDigits(orders.length)}</span>
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-border/80 bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
          <TabLink active={activeTab === "profile"} href="/profile">
            اطلاعات پروفایل
          </TabLink>
          <TabLink active={activeTab === "orders"} href="/profile?tab=orders">
            سفارش‌های من
            {orders.length > 0 ? (
              <span
                className={cn(
                  "mr-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  activeTab === "orders"
                    ? "bg-gold text-navy"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {toPersianDigits(orders.length)}
              </span>
            ) : null}
          </TabLink>
        </div>

        {activeTab === "profile" ? (
          <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:p-7">
            <div className="mb-5">
              <h2 className="font-bold text-navy">اطلاعات شخصی</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-7">
                اطلاعات خود را بررسی و در صورت نیاز به‌روز کنید.
              </p>
            </div>
            <ProfileForm user={user} />
          </div>
        ) : (
          <OrdersPanel orders={orders} />
        )}
      </div>
    </div>
  );
}

function OrdersPanel({
  orders,
}: {
  orders: {
    id: string;
    code: string;
    status: string;
    totalPrice: number;
    createdAt: Date;
    _count: { items: number };
  }[];
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
        <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-navy text-gold shadow-md ring-1 ring-gold/30">
          <ShoppingBag className="size-7" />
        </span>
        <h2 className="text-lg font-bold text-navy">هنوز سفارشی ثبت نکرده‌اید</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          از میان محصولات گالری انتخاب کنید و سفارش خود را ثبت کنید؛ سپس با تماس، سفارش نهایی می‌شود.
        </p>
        <Button asChild variant="gold" size="lg" className="mt-6">
          <Link href="/products">
            شروع خرید
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-navy">لیست سفارش‌ها</h2>
        <p className="text-xs text-muted-foreground">برای جزئیات روی هر سفارش بزنید</p>
      </div>

      <ul className="space-y-3">
        {orders.map((order) => {
          const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
          return (
            <li key={order.id}>
              <Link
                href={`/orders/${order.code}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold shadow-sm ring-1 ring-gold/25 transition-transform duration-300 group-hover:scale-105">
                    <Package className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-navy tracking-wide" dir="ltr">
                        {toPersianDigits(order.code)}
                      </p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5 text-gold/80" />
                        {toPersianDigits(formatDateJalali(order.createdAt))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="size-3.5 text-gold/80" />
                        {toPersianDigits(order._count.items)} قلم
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                  <div className="text-start sm:text-end">
                    <p className="text-[11px] text-muted-foreground">مبلغ کل</p>
                    <p className="font-extrabold text-navy">
                      {toPersianDigits(formatToman(order.totalPrice))}
                    </p>
                  </div>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-secondary text-navy transition-colors duration-300 group-hover:bg-navy group-hover:text-gold">
                    <ArrowLeft className="size-4" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-navy text-navy-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary/80 hover:text-navy"
      )}
    >
      {children}
    </Link>
  );
}
