import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  ExternalLink,
  MapPin,
  Phone,
  PhoneCall,
  Sparkles,
} from "lucide-react";

import { getInstagramUrl, getShopInfo } from "@/lib/shop";
import { toPersianDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباطی با گالری طلا و جواهر کریمی در بازار بزرگ تهران.",
};

const ORDER_STEPS = [
  "محصولات را به سبد اضافه کنید",
  "سفارش را ثبت کنید و کد بگیرید",
  "با گالری تماس بگیرید و کد را اعلام کنید",
  "پس از هماهنگی، سفارش تحویل می‌شود",
];

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function toMapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function ContactPage() {
  const { phone, mobile, address, instagram, experience } = getShopInfo();
  const instagramUrl = instagram ? getInstagramUrl(instagram) : "";

  return (
    <div className="beige-texture relative flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 45% at 90% 0%, rgba(201,161,74,0.22), transparent 55%), radial-gradient(ellipse 45% 40% at 0% 100%, rgba(1,3,78,0.08), transparent 50%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12 lg:px-8">
        {/* Intro */}
        <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 text-center">
          <div className="mb-4 flex justify-center">
            <span className="overflow-hidden rounded-2xl bg-navy shadow-lg ring-1 ring-gold/35">
              <Image
                src="/logo.png"
                alt="گالری طلا و جواهر کریمی"
                width={96}
                height={96}
                className="size-20 object-contain sm:size-24"
                priority
              />
            </span>
          </div>
          <Badge variant="gold" className="mb-3 px-3 py-1">
            <Sparkles className="size-3.5" />
            {experience}
          </Badge>
          <p className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            گالری <span className="text-gold">کریمی</span>
          </p>
          <h1 className="mt-1 text-lg font-semibold text-navy/75 sm:text-xl">
            تماس با ما
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            برای مشاوره خرید، پیگیری سفارش یا هر سوالی، کافی است تماس بگیرید یا در اینستاگرام پیام دهید.
          </p>
        </div>

        {/* Contact actions */}
        <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-100 mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ContactAction
            href={toTelHref(phone)}
            icon={<Phone className="size-5" />}
            label="تلفن ثابت"
            value={toPersianDigits(phone)}
            actionLabel="تماس"
            dir="ltr"
            emphasized
          />
          {mobile ? (
            <ContactAction
              href={toTelHref(mobile)}
              icon={<PhoneCall className="size-5" />}
              label="موبایل"
              value={toPersianDigits(mobile)}
              actionLabel="تماس"
              dir="ltr"
              emphasized
            />
          ) : null}
          {instagram && instagramUrl ? (
            <ContactAction
              href={instagramUrl}
              icon={<AtSign className="size-5" />}
              label="اینستاگرام"
              value={`@${instagram}`}
              actionLabel="مشاهده"
              dir="ltr"
              external
            />
          ) : null}
          <ContactAction
            href={toMapsHref(address)}
            icon={<MapPin className="size-5" />}
            label="آدرس فروشگاه"
            value={address}
            actionLabel="مسیریابی"
            external
            wrap
          />
        </div>

        {/* Order steps */}
        {/* <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-700 delay-200 mx-auto w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-center gap-2 sm:justify-between">
            <h2 className="text-base font-bold text-navy sm:text-lg">
              نحوه نهایی کردن سفارش
            </h2>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              ۴ مرحله
            </Badge>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/80 px-3.5 py-3.5 shadow-sm backdrop-blur-sm"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full gold-gradient text-xs font-bold text-white">
                  {toPersianDigits(index + 1)}
                </span>
                <span className="pt-0.5 text-xs leading-6 text-foreground/85 sm:text-sm">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div> */}

        <div className="animate-in fade-in fill-mode-both duration-700 delay-300 flex justify-center pb-4">
          <Button asChild variant="navy" size="lg">
            <Link href="/products">
              مشاهده محصولات
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContactAction({
  href,
  icon,
  label,
  value,
  actionLabel,
  dir,
  external,
  emphasized,
  wrap,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  actionLabel: string;
  dir?: "ltr" | "rtl";
  external?: boolean;
  emphasized?: boolean;
  wrap?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        emphasized ? "border-gold/35" : "border-border/80"
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl text-gold shadow-sm ring-1 ring-gold/25 transition-transform duration-300 group-hover:scale-105",
            emphasized ? "gold-gradient text-white ring-0" : "bg-navy"
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "mt-0.5 block text-sm font-bold text-navy sm:text-[0.95rem]",
              wrap ? "leading-6" : "truncate",
              dir === "ltr" && "text-end tracking-wide"
            )}
            dir={dir}
          >
            {value}
          </span>
        </span>
      </span>

      <span
        className={cn(
          "mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors duration-300",
          emphasized
            ? "bg-navy text-navy-foreground group-hover:bg-navy/90"
            : "bg-secondary text-secondary-foreground group-hover:bg-accent"
        )}
      >
        {actionLabel}
        {external ? (
          <ExternalLink className="size-3.5 shrink-0 opacity-80" />
        ) : (
          <Phone className="size-3.5 shrink-0 opacity-80" />
        )}
      </span>
    </a>
  );
}
