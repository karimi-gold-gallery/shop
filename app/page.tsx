import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Diamond, ShieldCheck, Truck, Sparkles, MapPin } from "lucide-react";

import { getProducts, getCategories } from "@/lib/products";
import { getGoldPrices } from "@/lib/gold-prices";
import { getUserDiscountPercent } from "@/lib/pricing";
import { getShopInfo } from "@/lib/shop";
import { getCurrentUser } from "@/lib/auth";
import { toPersianDigits, formatNumber } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const [goldPrices, featured, categories, user] = await Promise.all([
    getGoldPrices(),
    getProducts({ limit: 8 }),
    getCategories(),
    getCurrentUser(),
  ]);

  const discountPercent = getUserDiscountPercent(user);
  const { slogan, experience, address } = getShopInfo();

  return (
    <div className="beige-texture">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 75% 20%, rgba(201,161,74,0.35), transparent 45%), radial-gradient(circle at 15% 90%, rgba(1,3,78,0.08), transparent 40%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="text-navy space-y-6">
            <Badge variant="gold" className="px-3 py-1 text-sm">
              <Sparkles className="size-3.5" /> {experience}
            </Badge>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl sm:leading-[1.2] text-balance text-navy">
              گالری طلا و جواهر <span className="text-gold">کریمی</span>
            </h1>
            <p className="text-lg font-semibold text-primary">{slogan}</p>
            <p className="max-w-xl text-base leading-8 text-foreground/80 sm:text-lg">
              مجموعه‌ای نفیس از انگشتر، گردنبند، دستبند و زنجیر طلای ۱۸ و ۲۴ عیار با
              قیمت روز طلا و اصالت تضمینی. زیبایی را با ما تجربه کنید.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" />
              {address}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href="/products">
                  مشاهده محصولات
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="navy" size="lg">
                  <Link href="/login">ورود / ثبت‌نام</Link>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-6 pt-4 text-sm">
              <div className="flex items-center gap-2 text-navy/80">
                <ShieldCheck className="size-5 text-primary" />
                اصالت تضمینی
              </div>
              <div className="flex items-center gap-2 text-navy/80">
                <Truck className="size-5 text-primary" />
                تحویل امن
              </div>
              <div className="flex items-center gap-2 text-navy/80">
                <Diamond className="size-5 text-primary" />
                قیمت روز طلا
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border-4 border-gold/40 bg-navy shadow-2xl">
              <Image
                src="/logo.png"
                alt="گالری طلا و جواهر کریمی"
                width={512}
                height={512}
                className="size-full object-contain p-4"
                priority
              />
            </div>
            <div className="absolute -bottom-4 right-4 rounded-2xl border border-border bg-card p-4 shadow-xl">
              <p className="text-xs text-muted-foreground">قیمت هر گرم طلا</p>
              <p className="text-sm font-bold text-navy">
                ۱۸ عیار: {toPersianDigits(formatNumber(goldPrices[18]))} تومان
              </p>
              <p className="text-sm font-bold text-navy">
                ۲۴ عیار: {toPersianDigits(formatNumber(goldPrices[24]))} تومان
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`}>
              <Badge variant="secondary" className="px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy">محصولات منتخب</h2>
            <p className="text-sm text-muted-foreground mt-1">جدیدترین جواهرات طلای گالری کریمی</p>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link href="/products">
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              goldPrices={goldPrices}
              discountPercent={discountPercent}
            />
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-navy mb-2">سفارش خود را به‌سادگی نهایی کنید</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-7">
            پس از افزودن محصولات به سبد خرید، سفارش شما با یک کد یکتا ثبت می‌شود.
            کافی است با شماره گالری تماس بگیرید و کد سفارش را اعلام کنید تا فرآیند
            تحویل و تسویه انجام شود.
          </p>
        </div>
      </section>
    </div>
  );
}
