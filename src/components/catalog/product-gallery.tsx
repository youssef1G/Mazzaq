"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) return null;

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(max-width: 1000px) 100vw, 52vw"
        />
      </div>
      {images.length > 1 ? (
        <div className="gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="gallery-thumb"
              data-active={index === active}
              aria-label={image.alt}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <Image src={image.url} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="gallery-caption">
        <span>{name}</span>
      </div>
    </div>
  );
}
