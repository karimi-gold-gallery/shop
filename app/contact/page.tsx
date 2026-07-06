import type { Metadata } from "next";
import { AtSign, MapPin, Phone, PhoneCall } from "lucide-react";

import { getShopInfo } from "@/lib/shop";
import { toPersianDigits } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباطی با گالری طلا و جواهر کریمی در بازار بزرگ تهران.",
};

export default function ContactPage() {
  const { phone, mobile, address, instagram } = getShopInfo();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">تماس با ما</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground leading-7">
          برای مشاوره خرید، پیگیری سفارش یا هرگونه سوال، از راه‌های زیر با گالری کریمی
          در ارتباط باشید.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ContactCard
          icon={<Phone className="size-5 text-gold" />}
          label="تلفن ثابت"
          value={toPersianDigits(phone)}
          dir="ltr"
        />
        {mobile && (
          <ContactCard
            icon={<PhoneCall className="size-5 text-gold" />}
            label="موبایل"
            value={toPersianDigits(mobile)}
            dir="ltr"
          />
        )}
        <ContactCard
          icon={<MapPin className="size-5 text-gold" />}
          label="آدرس"
          value={address}
          className="sm:col-span-2"
        />
        {instagram && (
          <ContactCard
            icon={<AtSign className="size-5 text-gold" />}
            label="اینستاگرام"
            value={`@${instagram}`}
            dir="ltr"
            className="sm:col-span-2"
          />
        )}
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6 space-y-3">
          <h2 className="text-lg font-bold text-navy">نحوه ثبت و نهایی کردن سفارش</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm leading-7 text-foreground/85">
            <li>محصولات مورد نظر را به سبد خرید اضافه کنید.</li>
            <li>سفارش را ثبت کنید و کد سفارش خود را دریافت کنید.</li>
            <li>با شماره گالری تماس بگیرید و کد سفارش را اعلام کنید.</li>
            <li>پس از هماهنگی، سفارش شما نهایی و تحویل داده می‌شود.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  dir,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-6 flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-navy mb-1">{label}</p>
          <p className="text-sm text-foreground/85 leading-7" dir={dir}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
