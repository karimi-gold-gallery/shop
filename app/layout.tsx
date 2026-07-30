import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LivePriceRefresh } from "@/components/live-price-refresh";
import { Toaster } from "@/components/ui/sonner";
import { isMaintenanceMode } from "@/lib/maintenance";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "گالری طلا و جواهر کریمی",
    template: "%s | گالری کریمی",
  },
  description:
    "گالری طلا و جواهر کریمی با بیش از ۴۰ سال سابقه تک‌فروشی و بنکداری در بازار بزرگ تهران؛ خرید آنلاین انواع طلای ۱۸ و ۲۴ عیار، انگشتر، گردنبند، دستبند و زنجیر با قیمت روز طلا و کیفیت تضمینی.",
  keywords: ["طلا", "جواهر", "گالری طلا", "خرید طلا", "انگشتر", "گردنبند", "کریمی"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const maintenance = isMaintenanceMode();

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {!maintenance && <LivePriceRefresh />}
        {!maintenance && <SiteHeader />}
        <main className="flex-1 flex flex-col">{children}</main>
        {!maintenance && (
          <>
            <SiteFooter />
            <Toaster />
          </>
        )}
      </body>
    </html>
  );
}
