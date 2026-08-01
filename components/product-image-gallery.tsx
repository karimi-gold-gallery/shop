"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductImage = {
  id: string;
  mimeType: string;
};

export function ProductImageGallery({
  images,
  alt,
}: {
  images: ProductImage[];
  alt: string;
}) {
  const [activeId, setActiveId] = useState(images[0]?.id ?? null);
  const activeImage = images.find((image) => image.id === activeId) ?? images[0];

  if (!activeImage) {
    return (
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/50 shadow-sm">
        <div className="grid size-full place-items-center text-muted-foreground">
          بدون تصویر
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/50 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${activeImage.id}`}
          alt={alt}
          className="size-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image) => {
            const selected = image.id === activeImage.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-label="مشاهده تصویر"
                aria-pressed={selected}
                className={cn(
                  "aspect-square overflow-hidden rounded-lg border bg-secondary/40 transition-all cursor-pointer",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/images/${image.id}`}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
