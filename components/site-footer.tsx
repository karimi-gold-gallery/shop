import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, AtSign } from "lucide-react";

import { toPersianDigits } from "@/lib/format";
import { getShopInfo } from "@/lib/shop";

export function SiteFooter() {
  const { phone, mobile, address, instagram, slogan, experience } = getShopInfo();

  return (
    <footer className="navy-gradient text-navy-foreground mt-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="گالری طلا و جواهر کریمی"
              width={192}
              height={192}
              className="size-24 rounded-xl object-contain bg-navy ring-1 ring-gold/30"
            />
            <div className="leading-none">
              <p className="font-bold text-base">گالری طلا و جواهر کریمی</p>
              <p className="text-xs text-gold mt-1">{slogan}</p>
            </div>
          </div>
          <p className="text-sm text-navy-foreground/70 leading-6">
            {experience}؛ ارائه‌دهنده انواع طلای ۱۸ عیار و جواهرات اصیل با قیمت روز
            طلا و گارانتی اصالت.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-gold">دسترسی سریع</h3>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li><Link href="/products" className="hover:text-gold">محصولات</Link></li>
            <li><Link href="/about" className="hover:text-gold">درباره ما</Link></li>
            <li><Link href="/contact" className="hover:text-gold">تماس با ما</Link></li>
            <li><Link href="/cart" className="hover:text-gold">سبد خرید</Link></li>
            <li><Link href="/profile" className="hover:text-gold">پروفایل</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-gold">تماس با ما</h3>
          <ul className="space-y-3 text-sm text-navy-foreground/80">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-gold shrink-0" />
              <span dir="ltr">{toPersianDigits(phone)}</span>
            </li>
            {mobile && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-gold shrink-0" />
                <span dir="ltr">{toPersianDigits(mobile)}</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <MapPin className="size-4 text-gold shrink-0 mt-0.5" />
              <span>{address}</span>
            </li>
            {instagram && (
              <li className="flex items-center gap-2">
                <AtSign className="size-4 text-gold shrink-0" />
                <span dir="ltr">@{instagram}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-navy-foreground/15 bg-navy-foreground/5 p-4">
          <h3 className="font-semibold mb-2 text-gold">سفارش و تحویل</h3>
          <p className="text-sm text-navy-foreground/80 leading-6">
            پس از ثبت سفارش، کد سفارش شما صادر می‌شود. برای نهایی کردن سفارش کافی
            است با شماره گالری تماس بگیرید و کد سفارش خود را اعلام کنید.
          </p>
        </div>
      </div>

      <div className="border-t border-navy-foreground/15">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-navy-foreground/60">
          © {toPersianDigits(new Date().getFullYear())} گالری طلا و جواهر کریمی — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
