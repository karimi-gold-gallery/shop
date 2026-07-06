"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchBox({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const term = q.trim();
    if (term) params.set("q", term);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
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
