import type { Metadata } from "next";
import { Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  getLevelFromSpend,
  LEVEL_COUNTABLE_STATUSES,
} from "@/lib/user-levels";
import { formatDateJalali, formatToman, toPersianDigits } from "@/lib/format";
import {
  buildPagination,
  buildPagedHref,
  parsePageParam,
} from "@/lib/pagination";
import { PaginationControls } from "@/components/pagination-controls";
import {
  AdminUsersTable,
  CreateUserButton,
} from "@/components/admin-users";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "مدیریت کاربران" };

type SearchParams = Promise<{ page?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const page = parsePageParam(raw.page);
  const where = { role: "CUSTOMER" } as const;

  const total = await prisma.user.count({ where });
  const pagination = buildPagination(page, total);
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      city: true,
      address: true,
      nationalCode: true,
      postalCode: true,
      birthDate: true,
      gender: true,
      onboarded: true,
      createdAt: true,
      orders: {
        where: { status: { in: [...LEVEL_COUNTABLE_STATUSES] } },
        select: { totalPrice: true },
      },
      _count: { select: { orders: true } },
    },
  });

  const rows = users.map((user) => {
    const totalSpent = user.orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const level = getLevelFromSpend(totalSpent);
    const name = user.firstName
      ? `${user.firstName} ${user.lastName ?? ""}`.trim()
      : user.username;

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      phoneLabel: user.phone ? toPersianDigits(user.phone) : "—",
      city: user.city,
      address: user.address,
      nationalCode: user.nationalCode,
      postalCode: user.postalCode,
      birthDate: user.birthDate,
      gender: user.gender,
      onboarded: user.onboarded,
      name,
      level,
      orderCount: user._count.orders,
      createdAtLabel: toPersianDigits(formatDateJalali(user.createdAt)),
      totalSpentLabel: toPersianDigits(formatToman(totalSpent)),
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="hidden size-11 place-items-center rounded-xl bg-navy text-gold shadow-sm ring-1 ring-gold/25 sm:grid">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy">مدیریت کاربران</h1>
            <p className="text-sm text-muted-foreground">
              {toPersianDigits(pagination.total)} مشتری · سطح بر اساس مجموع
              خریدهای تسویه‌شده
            </p>
          </div>
        </div>
        <CreateUserButton />
      </div>

      <Card className="overflow-hidden p-0">
        <AdminUsersTable users={rows} />
      </Card>

      <PaginationControls
        pagination={pagination}
        itemLabel="مشتری"
        hrefForPage={(p) => buildPagedHref("/admin/users", raw, p)}
      />
    </div>
  );
}
