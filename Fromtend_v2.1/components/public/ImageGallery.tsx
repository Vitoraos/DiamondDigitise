"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const displayImages = images.slice(0, 5);

  if (displayImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-depth flex items-center justify-center text-dim">
        No Images Available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-[4/3] relative bg-depth overflow-hidden">
        <Image
          src={displayImages[selected]}
          alt={`${alt} - ${selected + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {displayImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {displayImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "aspect-square relative bg-depth overflow-hidden border-2 transition-colors",
                selected === i ? "border-gold" : "border-transparent hover:border-white/20"
              )}
            >
              <Image
                src={url}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
