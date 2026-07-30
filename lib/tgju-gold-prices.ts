import * as cheerio from "cheerio";

const TGJU_URL = "https://www.tgju.org/";
const TGJU_LIVE_URLS = [
  "https://call2.tgju.org/ajax.json",
  "https://call3.tgju.org/ajax.json",
  "https://call4.tgju.org/ajax.json",
];
const PERSIAN_AND_ARABIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
const COLUMN_KEYS: Record<string, string> = {
  "قیمت زنده": "livePrice",
  "تغییر": "change",
  "کمترین": "low",
  "بیشترین": "high",
  "زمان": "time",
  "آخرین قیمت": "lastPrice",
  "نرخ ارز دولتی": "officialRate",
  "خرید / نیما": "nimaBuy",
  "فروش / نیما": "nimaSell",
  "مرکز مبادله / حواله خرید": "exchangeTransferBuy",
  "مرکز مبادله / حواله فروش": "exchangeTransferSell",
  "قیمت ریالی": "priceRial",
  "قیمت دلاری": "priceUsd",
  "خرید و فروش": "buyAndSell",
  "قیمت": "price",
  "نرخ برابری": "exchangeRate",
  "قیمت / دلار": "priceUsd",
  "ارزش": "value",
};
const LIVE_PRICE_COLUMNS = new Set([
  "livePrice",
  "lastPrice",
  "price",
  "priceUsd",
  "value",
  "exchangeRate",
]);

type MarketValue = number | string;

type TgjuLiveItem = {
  p: string;
  h: string;
  l: string;
  d: string;
  dp: number | string;
  t: string;
  t_en?: string;
};

type TgjuLiveResponse = {
  current: Record<string, TgjuLiveItem>;
};

export type TgjuKaratPrice = {
  karat: 18 | 24;
  slug: "geram18" | "geram24";
  livePriceRial: number;
  sourceTime: string;
};

export type MarketPrice = {
  name: string;
  slug: string | null;
  values: Record<string, MarketValue>;
};

export type MarketSection = {
  name: string;
  columns: string[];
  prices: MarketPrice[];
};

export type TgjuMarketPrices = {
  source: string;
  fetchedAt: string;
  sections: MarketSection[];
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDigits(value: string): string {
  return value.replace(
    /[۰-۹٠-٩]/g,
    (digit) => String(PERSIAN_AND_ARABIC_DIGITS.indexOf(digit) % 10)
  );
}

function parseValue(value: string): MarketValue {
  const normalized = normalizeDigits(cleanText(value)).replace(/٬/g, ",");

  if (/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(normalized)) {
    const number = Number(normalized.replace(/,/g, ""));
    if (Number.isFinite(number)) return number;
  }

  return normalized;
}

export function parseTgjuMarketPrices(
  html: string,
  fetchedAt = new Date().toISOString()
): TgjuMarketPrices {
  const $ = cheerio.load(html);
  const sections = new Map<string, MarketSection>();

  $("table.market-table").each((_, table) => {
    const $table = $(table);
    const $rows = $table
      .children("thead, tbody")
      .children("tr")
      .add($table.children("tr"));
    const $header = $rows
      .filter((_, row) => {
        const $cells = $(row).children("th, td");
        return $cells.length > 1 && $cells.filter("td").length === 0;
      })
      .first();

    if (!$header.length) return;

    const headers = $header
      .children("th")
      .map((_, cell) => cleanText($(cell).text()))
      .get();
    const sectionName = headers[0];
    const columns = headers
      .slice(1)
      .filter(Boolean)
      .map((column) => COLUMN_KEYS[column] ?? column);

    if (!sectionName || columns.length === 0) return;

    const sectionKey = `${sectionName}\u0000${columns.join("\u0000")}`;
    const section = sections.get(sectionKey) ?? {
      name: sectionName,
      columns,
      prices: [],
    };
    const existingItems = new Set(
      section.prices.map((price) => price.slug ?? price.name)
    );

    $rows.each((_, row) => {
      const $cells = $(row).children("th, td");
      const $dataCells = $cells.filter("td");
      if (!$dataCells.length) return;

      const name = cleanText($cells.filter("th").first().text());
      const slug =
        $(row).attr("data-market-nameslug") ||
        $(row).attr("data-market-row") ||
        null;
      const itemKey = slug || name;

      if (!name || existingItems.has(itemKey)) return;

      const values: Record<string, MarketValue> = {};
      $dataCells.each((index, cell) => {
        const column = columns[index];
        const value = cleanText($(cell).text());
        if (column && value) values[column] = parseValue(value);
      });

      if (Object.keys(values).length === 0) return;

      section.prices.push({ name, slug, values });
      existingItems.add(itemKey);
    });

    if (section.prices.length > 0) sections.set(sectionKey, section);
  });

  const parsedSections = [...sections.values()];
  if (parsedSections.length === 0) {
    throw new Error("Could not find market prices in the TGJU response");
  }

  return {
    source: TGJU_URL,
    fetchedAt,
    sections: parsedSections,
  };
}

function mergeLivePrices(
  parsed: TgjuMarketPrices,
  liveItems: Record<string, TgjuLiveItem>
): TgjuMarketPrices {
  for (const section of parsed.sections) {
    for (const price of section.prices) {
      if (!price.slug) continue;

      const live = liveItems[price.slug];
      if (!live) continue;

      for (const column of section.columns) {
        if (LIVE_PRICE_COLUMNS.has(column)) {
          price.values[column] = parseValue(live.p);
        } else if (column === "priceRial") {
          const rialPrice = liveItems[`${price.slug}-irr`];
          if (rialPrice) price.values[column] = parseValue(rialPrice.p);
        } else if (column === "change") {
          price.values[column] = `(${normalizeDigits(String(live.dp))}%) ${normalizeDigits(live.d)}`;
        } else if (column === "low") {
          price.values[column] = parseValue(live.l);
        } else if (column === "high") {
          price.values[column] = parseValue(live.h);
        } else if (column === "time") {
          price.values[column] = normalizeDigits(live.t_en ?? live.t);
        }
      }
    }
  }

  return parsed;
}

function isLiveResponse(value: unknown): value is TgjuLiveResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "current" in value &&
    typeof value.current === "object" &&
    value.current !== null
  );
}

async function fetchTgjuLivePrices(): Promise<TgjuLiveResponse> {
  const startIndex = Math.floor(Math.random() * TGJU_LIVE_URLS.length);
  let lastError: unknown;

  for (let offset = 0; offset < TGJU_LIVE_URLS.length; offset++) {
    const baseUrl = TGJU_LIVE_URLS[(startIndex + offset) % TGJU_LIVE_URLS.length];

    try {
      const response = await fetch(
        `${baseUrl}?rev=${Date.now()}-${Math.random()}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Referer: TGJU_URL,
            "User-Agent": "Mozilla/5.0 (compatible; KarimiGoldGallery/1.0)",
          },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (!response.ok) {
        throw new Error(`TGJU live request failed with status ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isLiveResponse(data)) {
        throw new Error("TGJU live response has an unexpected format");
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not fetch TGJU live prices");
}

export async function fetchTgjuKaratPrices(): Promise<{
  18: TgjuKaratPrice;
  24: TgjuKaratPrice;
}> {
  const { current } = await fetchTgjuLivePrices();

  function readPrice(
    karat: 18 | 24,
    slug: "geram18" | "geram24"
  ): TgjuKaratPrice {
    const item = current[slug];
    const livePriceRial = item ? parseValue(item.p) : null;

    if (typeof livePriceRial !== "number" || livePriceRial <= 0) {
      throw new Error(`TGJU live feed is missing ${slug}`);
    }

    return {
      karat,
      slug,
      livePriceRial,
      sourceTime: normalizeDigits(item.t_en ?? item.t),
    };
  }

  return {
    18: readPrice(18, "geram18"),
    24: readPrice(24, "geram24"),
  };
}

export async function fetchTgjuMarketPrices(): Promise<TgjuMarketPrices> {
  const [response, live] = await Promise.all([
    fetch(TGJU_URL, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; KarimiGoldGallery/1.0)",
      },
      signal: AbortSignal.timeout(10_000),
    }),
    fetchTgjuLivePrices(),
  ]);

  if (!response.ok) {
    throw new Error(`TGJU request failed with status ${response.status}`);
  }

  return mergeLivePrices(
    parseTgjuMarketPrices(await response.text(), new Date().toISOString()),
    live.current
  );
}
