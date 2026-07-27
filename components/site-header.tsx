import Link from "next/link";
import Image from "next/image";
import { Diamond, ShoppingBag, User } from "lucide-react";

import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";
import { countRows } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { getGoldPricePerGram } from "@/lib/gold-price";
import { toPersianDigits, formatNumber } from "@/lib/format";
import { SearchBox } from "@/components/search-box";
import { UserMenu } from "@/components/user-menu";
import { DesktopNav, MobileNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/products";

export async function GoldPriceStrip() {
  const price = await getGoldPricePerGram();
  return (
    <div className="navy-gradient text-navy-foreground text-xs sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5">
        <Diamond className="size-3.5 text-gold" />
        <span>قیمت روز طلا (هر گرم ۱۸ عیار):</span>
        <span className="font-bold text-gold">
          {toPersianDigits(formatNumber(price))} تومان
        </span>
        <span className="hidden sm:inline text-navy-foreground/60">— قیمت‌ها به‌صورت لحظه‌ای به‌روز می‌شوند</span>
      </div>
    </div>
  );
}

export async function SiteHeader() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);
  let cartCount = 0;
  if (user) {
    cartCount = await countRows(cartItems, eq(cartItems.userId, user.id));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <GoldPriceStrip />
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="overflow-hidden rounded-xl bg-navy shadow-sm ring-1 ring-gold/30">
            <Image
              src="/logo.png"
              alt="گالری طلا و جواهر کریمی"
              width={128}
              height={128}
              className="h-16 w-16 object-contain"
              priority
            />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-lg text-navy">گالری کریمی</span>
            <span className="text-[11px] text-muted-foreground">طلا و جواهر</span>
          </span>
        </Link>

        <DesktopNav categories={categories} />

        <div className="flex-1 max-w-md hidden md:block">
          <SearchBox />
        </div>

        <div className="mr-auto flex items-center gap-1.5 sm:gap-2">
          <MobileNav categories={categories} />
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="سبد خرید">
            <Link href="/cart">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {toPersianDigits(cartCount)}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button asChild variant="navy" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">
                <User className="size-4" />
                ورود / ثبت‌نام
              </Link>
            </Button>
          )}

        </div>
      </div>

      <div className="md:hidden border-t border-border px-4 py-2">
        <SearchBox />
      </div>
    </header>
  );
}
