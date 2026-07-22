import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Pagination } from "@/lib/pagination";
import { toPersianDigits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  pagination: Pagination;
  /** Build href for a given page number. */
  hrefForPage: (page: number) => string;
  className?: string;
  /** Optional noun for the range label, e.g. "محصول". */
  itemLabel?: string;
};

function pageWindow(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function PaginationControls({
  pagination,
  hrefForPage,
  className,
  itemLabel,
}: Props) {
  if (pagination.total <= pagination.pageSize) return null;

  const pages = pageWindow(pagination.page, pagination.totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        نمایش {toPersianDigits(pagination.from)} تا {toPersianDigits(pagination.to)} از{" "}
        {toPersianDigits(pagination.total)}
        {itemLabel ? ` ${itemLabel}` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrev}
          className={!pagination.hasPrev ? "pointer-events-none opacity-50" : undefined}
        >
          <Link
            href={pagination.hasPrev ? hrefForPage(pagination.page - 1) : "#"}
            aria-disabled={!pagination.hasPrev}
            tabIndex={pagination.hasPrev ? undefined : -1}
          >
            <ChevronRight className="size-4" />
            قبلی
          </Link>
        </Button>

        {pages.map((page, index) => {
          const prev = pages[index - 1];
          const showEllipsis = prev != null && page - prev > 1;
          const active = page === pagination.page;

          return (
            <span key={page} className="contents">
              {showEllipsis ? (
                <span className="px-1 text-sm text-muted-foreground">…</span>
              ) : null}
              <Button
                asChild
                variant={active ? "navy" : "outline"}
                size="sm"
                className="min-w-9 px-2"
              >
                <Link href={hrefForPage(page)} aria-current={active ? "page" : undefined}>
                  {toPersianDigits(page)}
                </Link>
              </Button>
            </span>
          );
        })}

        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!pagination.hasNext}
          className={!pagination.hasNext ? "pointer-events-none opacity-50" : undefined}
        >
          <Link
            href={pagination.hasNext ? hrefForPage(pagination.page + 1) : "#"}
            aria-disabled={!pagination.hasNext}
            tabIndex={pagination.hasNext ? undefined : -1}
          >
            بعدی
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
