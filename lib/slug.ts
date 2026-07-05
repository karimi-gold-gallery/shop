export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const random = Math.random().toString(36).slice(2, 7);
  return `${base || "item"}-${random}`;
}

export function slugifyCategory(input: string): string {
  return slugify(input);
}
