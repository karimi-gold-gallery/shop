import type { Metadata } from "next";
import Image from "next/image";
import { Clock3, Phone, Sparkles } from "lucide-react";

import { toPersianDigits } from "@/lib/format";
import { getShopInfo } from "@/lib/shop";

export const metadata: Metadata = {
  title: "به‌زودی",
  description: "گالری طلا و جواهر کریمی به‌زودی در دسترس خواهد بود.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  const { phone, mobile, slogan, experience } = getShopInfo();

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden beige-texture px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 15%, rgba(201,161,74,0.28), transparent 42%), radial-gradient(circle at 20% 85%, rgba(1,3,78,0.08), transparent 40%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-8 overflow-hidden rounded-2xl bg-navy p-3 ring-1 ring-gold/40 shadow-xl">
          <Image
            src="/logo.png"
            alt="گالری طلا و جواهر کریمی"
            width={160}
            height={160}
            priority
            className="size-28 object-contain sm:size-36"
          />
        </div>

        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          {experience}
        </p>

        <h1 className="text-3xl font-extrabold leading-tight text-navy sm:text-4xl text-balance">
          گالری طلا و جواهر{" "}
          <span className="text-gold">کریمی</span>
        </h1>

        <p className="mt-3 text-base font-semibold text-primary">{slogan}</p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full gold-gradient text-navy-foreground shadow-lg">
            <Clock3 className="size-7" />
          </div>
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            به‌زودی آماده می‌شویم
          </h2>
          <p className="max-w-md text-base leading-8 text-foreground/80">
            وب‌سایت گالری کریمی در حال آماده‌سازی است. به‌زودی می‌توانید از مجموعه
            نفیس طلا و جواهرات ما به صورت آنلاین خرید کنید.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p className="font-medium text-navy/70">برای ارتباط با ما:</p>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            dir="ltr"
          >
            <Phone className="size-4 text-primary" />
            {toPersianDigits(phone)}
          </a>
        </div>
      </div>
    </div>
  );
}
