import type { Metadata } from "next";
import { Users } from "lucide-react";

import { count, desc, eq, inArray, sql } from "drizzle-orm";

import { countRows, db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
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

type OrderStats = { orderCount: number; totalSpent: number };

async function getOrderStats(
  userIds: string[]
): Promise<Map<string, OrderStats>> {
  if (userIds.length === 0) return new Map();

  const rows = await db
    .select({
      userId: orders.userId,
      orderCount: count(),
      totalSpent: sql<number>`coalesce(sum(case when ${inArray(
        orders.status,
        [...LEVEL_COUNTABLE_STATUSES]
      )} then ${orders.totalPrice} else 0 end), 0)`,
    })
    .from(orders)
    .where(inArray(orders.userId, userIds))
    .groupBy(orders.userId);

  return new Map(
    rows.map((row) => [
      row.userId,
      { orderCount: row.orderCount, totalSpent: Number(row.totalSpent) },
    ])
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const page = parsePageParam(raw.page);
  const where = eq(users.role, "CUSTOMER");

  const total = await countRows(users, where);
  const pagination = buildPagination(page, total);
  const customers = await db.query.users.findMany({
    where,
    orderBy: desc(users.createdAt),
    offset: pagination.skip,
    limit: pagination.take,
    columns: {
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
      discountPercent: true,
      onboarded: true,
      createdAt: true,
    },
  });

  // One grouped pass over this page's customers: total orders, and the spend
  // that counts toward their level.
  const orderStats = await getOrderStats(customers.map((c) => c.id));

  const rows = customers.map((user) => {
    const stats = orderStats.get(user.id);
    const totalSpent = stats?.totalSpent ?? 0;
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
      discountPercent: user.discountPercent,
      onboarded: user.onboarded,
      name,
      level,
      orderCount: stats?.orderCount ?? 0,
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
              خریدهای تسویه‌شده · تخفیف اختصاصی روی همه قیمت‌های همان مشتری
              اعمال می‌شود
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
