const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => persianDigits[Number(d)]);
}

/** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to English (0-9). */
export function toEnglishDigits(value: string | number): string {
  return String(value)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - "۰".charCodeAt(0)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - "٠".charCodeAt(0)));
}

const tomanFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const gramFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 3,
});

export function formatToman(amount: number): string {
  return `${tomanFormatter.format(Math.round(amount))} تومان`;
}

export function formatNumber(amount: number): string {
  return tomanFormatter.format(Math.round(amount));
}

export function formatGram(weight: number): string {
  return `${gramFormatter.format(weight)} گرم`;
}

export function formatDateJalali(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(date);
}

export function formatDateJalaliShort(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
    timeZone: "Asia/Tehran",
  }).format(date);
}
