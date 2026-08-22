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

const FLOOR_DATA: Record<FloorId, Omit<FloorPlan, "id">> = {
  "minus-6": {
    label: "منفی ۶",
    shortLabel: "-6",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-61.jpg",
  },
  "minus-5": {
    label: "منفی ۵",
    shortLabel: "-5",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-51.jpg",
  },
  "minus-4": {
    label: "منفی ۴",
    shortLabel: "-4",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-41.jpg",
  },
  "minus-3": {
    label: "منفی ۳",
    shortLabel: "-3",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-31.jpg",
  },
  "minus-2": {
    label: "منفی ۲",
    shortLabel: "-2",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-21.jpg",
  },
  "minus-1": {
    label: "منفی ۱",
    shortLabel: "-1",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Manfi-1.jpg",
  },
  ground: {
    label: "همکف",
    shortLabel: "همکف",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Hamkaf.jpg",
  },
  "plus-1": {
    label: "طبقه اول",
    shortLabel: "+1",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Mosbat-11.jpg",
  },
  "plus-2": {
    label: "طبقه دوم",
    shortLabel: "+2",
    image:
      "https://delgosha-mall.ir/wp-content/uploads/2023/02/tabaghe-Mosbat-21.jpg",
  },
};

/** Display order: −6 … همکف … +2 */
export const FLOOR_ORDER: FloorId[] = [
  "minus-6",
  "minus-5",
  "minus-4",
  "minus-3",
  "minus-2",
  "minus-1",
  "ground",
  "plus-1",
  "plus-2",
];

export const FLOOR_PLANS: FloorPlan[] = FLOOR_ORDER.map((id) => ({
  id,
  ...FLOOR_DATA[id],
}));
