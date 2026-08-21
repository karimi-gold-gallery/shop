export type FloorId =
  | "plus-2"
  | "plus-1"
  | "ground"
  | "minus-1"
  | "minus-2"
  | "minus-3"
  | "minus-4"
  | "minus-5"
  | "minus-6";

export type FloorPlan = {
  id: FloorId;
  label: string;
  shortLabel: string;
  image: string;
};

/** Floors ordered top → bottom (+2 … −6), matching the mall directory. */
export const FLOOR_PLANS: FloorPlan[] = [
  {
    id: "plus-2",
    label: "طبقه دوم",
    shortLabel: "+۲",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Mosbat-21.jpg",
  },
  {
    id: "plus-1",
    label: "طبقه اول",
    shortLabel: "+۱",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Mosbat-11.jpg",
  },
  {
    id: "ground",
    label: "همکف",
    shortLabel: "۰",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Hamkaf.jpg",
  },
  {
    id: "minus-1",
    label: "منفی ۱",
    shortLabel: "−۱",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-1.jpg",
  },
  {
    id: "minus-2",
    label: "منفی ۲",
    shortLabel: "−۲",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-21.jpg",
  },
  {
    id: "minus-3",
    label: "منفی ۳",
    shortLabel: "−۳",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-31.jpg",
  },
  {
    id: "minus-4",
    label: "منفی ۴",
    shortLabel: "−۴",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-41.jpg",
  },
  {
    id: "minus-5",
    label: "منفی ۵",
    shortLabel: "−۵",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-51.jpg",
  },
  {
    id: "minus-6",
    label: "منفی ۶",
    shortLabel: "−۶",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-61.jpg",
  },
];
