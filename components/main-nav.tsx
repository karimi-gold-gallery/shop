"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Category = {
  id: string;
  name: string;
  slug: string;
};

const navLinkClass =
  "rounded-md px-3 py-2 text-foreground/80 hover:bg-secondary hover:text-navy transition-colors";

const mainLinks = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/live-prices", label: "قیمت‌های لحظه‌ای" },
] as const;

export function DesktopNav({ categories }: { categories: Category[] }) {
  return (
    <nav className="hidden lg:flex items-center gap-1 text-sm">
      {mainLinks.map((link) => (
        <Link key={link.href} href={link.href} className={navLinkClass}>
          {link.label}
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${navLinkClass} inline-flex items-center gap-1`}>
            دسته‌بندی‌ها
            <ChevronDown className="size-4 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          {categories.map((category) => (
            <DropdownMenuItem key={category.id} asChild>
              <Link href={`/products?category=${category.slug}`}>{category.name}</Link>
            </DropdownMenuItem>
          ))}
          {categories.length === 0 && (
            <DropdownMenuItem disabled>دسته‌بندی‌ای ثبت نشده</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="منو">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>منوی سایت</DialogTitle>
        </DialogHeader>
        <nav className="flex flex-col gap-1 text-sm">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">دسته‌بندی‌ها</p>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={navLinkClass}
              onClick={() => setOpen(false)}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
