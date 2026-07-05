const DEFAULTS = {
  phone: "021-52002092",
  mobile: "",
  address: "بازار بزرگ تهران، پاساژ دلگشا، طبقه ۳، واحد ۲۷",
  instagram: "",
  slogan: "زیبایی و شکوهی که شایسته شماست",
  experience: "با بیش از ۴۰ سال سابقه تک‌فروشی و بنکداری",
};

export type ShopInfo = typeof DEFAULTS;

export function getShopInfo(): ShopInfo {
  return {
    phone: process.env.SHOP_PHONE || DEFAULTS.phone,
    mobile: process.env.SHOP_MOBILE ?? DEFAULTS.mobile,
    address: process.env.SHOP_ADDRESS || DEFAULTS.address,
    instagram: process.env.SHOP_INSTAGRAM ?? DEFAULTS.instagram,
    slogan: process.env.SHOP_SLOGAN || DEFAULTS.slogan,
    experience: process.env.SHOP_EXPERIENCE || DEFAULTS.experience,
  };
}
