import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { fetchTgjuKaratPrices, fetchTgjuMarketPrices, type TgjuMarketPrices } from "@/lib/tgju-gold-prices";
import { formatDateJalaliShort, formatToman, toPersianDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "قیمت‌های لحظه‌ای",
  description: "نمایش قیمت‌های زنده طلا، ارز و سکه برای نمایشگاه",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = { label: string; value: string };

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findMarketItem(market: TgjuMarketPrices, patterns: RegExp[]): (typeof market.sections)[number]["prices"][number] | null {
  for (const section of market.sections) {
    for (const item of section.prices) {
      const name = item.name ? normalize(item.name) : "";
      const slug = item.slug ? normalize(item.slug) : "";

      if (patterns.some((p) => p.test(name) || (slug && p.test(slug)))) return item;
    }
  }
  return null;
}

function formatMarketToToman(item: ReturnType<typeof findMarketItem>): string | null {
  if (!item) return null;

  const candidatesRialKeys = ["priceRial", "livePrice", "lastPrice", "low", "high", "price"] as const;
  for (const key of candidatesRialKeys) {
    const raw = item.values[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      // TGJU values are typically in Rial; convert to Toman.
      return formatToman(raw / 10);
    }
  }

  return null;
}

export default async function LivePricesPage() {
  const rows: Row[] = [];

  try {
    const [karatPrices, marketPrices] = await Promise.all([
      fetchTgjuKaratPrices(),
      fetchTgjuMarketPrices(),
    ]);

    rows.push({
      label: "طلای ۱۸",
      value: toPersianDigits(formatToman(karatPrices[18].livePriceRial / 10)),
    });
    rows.push({
      label: "طلای ۲۴",
      value: toPersianDigits(formatToman(karatPrices[24].livePriceRial / 10)),
    });

    const itemsToFind: Array<{ label: string; patterns: RegExp[] }> = [
      { label: "اونس طلا", patterns: [/اونس.*طلا/i, /اونس/i] },
      { label: "یک مثقال طلا", patterns: [/مثقال.*طلا/i, /مثقال/i] },
      { label: "دلار", patterns: [/دلار/i, /USD/i] },
      { label: "یورو", patterns: [/یورو/i, /EUR/i] },
      { label: "سکه قدیم", patterns: [/سکه.*قدیم/i, /سکه قدیم/i] },
      { label: "سکه جدید", patterns: [/سکه.*جدید/i, /سکه جدید/i] },
      { label: "نیم سکه", patterns: [/نیم سکه/i] },
      { label: "ربع سکه", patterns: [/ربع سکه/i] },
      { label: "سکه گرمی", patterns: [/سکه.*گرمی/i, /گرمی/i] },
      { label: "درهم امارات", patterns: [/درهم.*امارات/i, /درهم امارات/i] },
    ];

    for (const item of itemsToFind) {
      const found = findMarketItem(marketPrices, item.patterns);
      const value = formatMarketToToman(found);
      if (!value) continue; // only show what we can actually format
      rows.push({ label: item.label, value });
    }

    const fetchedAt = marketPrices.fetchedAt;

    if (rows.length === 0) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <h1 className="text-2xl font-bold text-navy mb-3">قیمت‌های لحظه‌ای</h1>
          <p className="text-sm text-muted-foreground">امکان دریافت قیمت‌ها در حال حاضر وجود ندارد.</p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-navy">قیمت‌های لحظه‌ای</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            به‌روزرسانی: {formatDateJalaliShort(fetchedAt)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.label} className="p-6">
              <p className="text-sm text-muted-foreground">{row.label}</p>
              <p className="mt-3 text-4xl font-extrabold text-navy leading-tight">
                {toPersianDigits(row.value)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h1 className="text-2xl font-bold text-navy mb-3">قیمت‌های لحظه‌ای</h1>
        <p className="text-sm text-muted-foreground">امکان دریافت قیمت‌ها در حال حاضر وجود ندارد.</p>
      </div>
    );
  }
}

