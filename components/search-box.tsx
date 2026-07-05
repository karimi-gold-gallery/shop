"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchBox({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجوی محصول..."
        className="pr-9 bg-secondary/40 border-transparent focus-visible:bg-background"
        aria-label="جستجو"
      />
    </form>
  );
}
