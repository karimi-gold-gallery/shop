const DEFAULTS = {
  phone: "021-52002092",
  mobile: "",
  address: "بازار بزرگ تهران، پاساژ دلگشا، طبقه ۳، واحد ۲۷",
  /** Instagram handle only (no @, no URL) */
  instagram: "karimigold_gallery",
  slogan: "زیبایی و شکوهی که شایسته شماست",
  experience: "با بیش از ۴۰ سال سابقه تک‌فروشی و بنکداری",
};

export type ShopInfo = typeof DEFAULTS;

/** Prefer env when set; empty string falls back to default. */
function pick(envValue: string | undefined, fallback: string): string {
  const value = envValue?.trim();
  return value ? value : fallback;
}

/** Accept handle, @handle, or full Instagram URL → bare handle. */
export function toInstagramHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const fromUrl = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (fromUrl) return fromUrl[1];
  return trimmed.replace(/^@/, "");
}

export function getInstagramUrl(handle: string): string {
  const normalized = toInstagramHandle(handle);
  return normalized ? `https://www.instagram.com/${normalized}/` : "";
}

export function getShopInfo(): ShopInfo {
  return {
    phone: pick(process.env.SHOP_PHONE, DEFAULTS.phone),
    mobile: pick(process.env.SHOP_MOBILE, DEFAULTS.mobile),
    address: pick(process.env.SHOP_ADDRESS, DEFAULTS.address),
    instagram: toInstagramHandle(pick(process.env.SHOP_INSTAGRAM, DEFAULTS.instagram)),
    slogan: pick(process.env.SHOP_SLOGAN, DEFAULTS.slogan),
    experience: pick(process.env.SHOP_EXPERIENCE, DEFAULTS.experience),
  };
}
