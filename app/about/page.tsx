import type { Metadata } from "next";
import Image from "next/image";
import { Diamond, ShieldCheck, Sparkles, Users } from "lucide-react";

import { getShopInfo } from "@/lib/shop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "آشنایی با گالری طلا و جواهر کریمی؛ بیش از ۴۰ سال سابقه در بازار بزرگ تهران.",
};

export default function AboutPage() {
  const { slogan, experience, address } = getShopInfo();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 flex flex-col items-center gap-6 sm:flex-row-reverse sm:items-center sm:justify-center sm:gap-8">
        <div className="overflow-hidden rounded-3xl border-4 border-gold/30 bg-navy shadow-xl shrink-0">
          <Image
            src="/logo.png"
            alt="گالری طلا و جواهر کریمی"
            width={320}
            height={320}
            className="size-28 object-contain p-3 sm:size-36 sm:p-4"
            priority
          />
        </div>
        <div className="text-center sm:text-start">
          <Badge variant="gold" className="mb-4 px-3 py-1">
            <Sparkles className="size-3.5" /> {experience}
          </Badge>
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">درباره گالری کریمی</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground leading-7 sm:mx-0">{slogan}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mb-10">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Users className="mx-auto size-8 text-primary" />
            <h2 className="font-semibold text-navy">سابقه درخشان</h2>
            <p className="text-sm text-muted-foreground leading-6">
              {experience} در بازار بزرگ تهران با اعتماد هزاران مشتری.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <ShieldCheck className="mx-auto size-8 text-primary" />
            <h2 className="font-semibold text-navy">اصالت تضمینی</h2>
            <p className="text-sm text-muted-foreground leading-6">
              تمامی محصولات با ضمانت اصالت و کیفیت طلای ۱۸ یا ۲۴ عیار عرضه می‌شوند.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Diamond className="mx-auto size-8 text-primary" />
            <h2 className="font-semibold text-navy">قیمت روز طلا</h2>
            <p className="text-sm text-muted-foreground leading-6">
              قیمت‌گذاری شفاف بر اساس نرخ روز طلا و اجرت ساخت.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-navy">داستان ما</h2>
        <p className="text-sm sm:text-base leading-8 text-foreground/85">
          گالری طلا و جواهر کریمی با تکیه بر تجربه خانوادگی و شناخت عمیق از بازار طلا،
          مجموعه‌ای منتخب از انگشتر، گردنبند، دستبند، زنجیر و جواهرات اصیل را به
          مشتریان عرضه می‌کند. هدف ما ارائه زیبایی، کیفیت و اعتماد در هر خرید است.
        </p>
        <p className="text-sm sm:text-base leading-8 text-foreground/85">
          امروز با فروش آنلاین، امکان مشاهده محصولات و ثبت سفارش از هر نقطه فراهم شده
          است؛ سپس با تماس مستقیم با گالری، سفارش شما نهایی و تحویل داده می‌شود.
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-navy">آدرس:</span> {address}
        </p>
      </div>
    </div>
  );
}
