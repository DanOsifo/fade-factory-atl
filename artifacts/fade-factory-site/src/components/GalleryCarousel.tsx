import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/fadefactory_atl";

const STATIC_PHOTOS = [
  { src: "/shop-1.jpg",  alt: "Fade Factory ATL — hexagonal ceiling lights" },
  { src: "/shop-2.jpg",  alt: "Fade Factory ATL — barber station interior" },
  { src: "/shop-3.jpg",  alt: "Fade Factory ATL — neon signs and motivational wall" },
  { src: "/shop-4.jpg",  alt: "Fade Factory ATL — barber cutting hair" },
  { src: "/shop-5.jpg",  alt: "Fade Factory ATL — suite hallway" },
  { src: "/shop-6.jpg",  alt: "Fade Factory ATL — My Salon Suite exterior" },
  { src: "/shop-7.jpg",  alt: "Fade Factory ATL — Barber Shop neon sign" },
  { src: "/shop-8.jpg",  alt: "Fade Factory ATL — full shop view" },
  { src: "/shop-9.jpg",  alt: "Fade Factory ATL — barber pole close-up" },
  { src: "/shop-10.jpg", alt: "Fade Factory ATL — shop interior wide" },
];

type GalleryItem = { src: string; alt: string };

type Props = {
  images?: GalleryItem[];
};

export default function GalleryCarousel({ images }: Props) {
  const photos: GalleryItem[] = images && images.length > 0 ? images : STATIC_PHOTOS;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  useEffect(() => {
    setCurrent(prev => Math.min(prev, Math.max(photos.length - 1, 0)));
  }, [photos.length]);

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main photo */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square overflow-hidden rounded-sm relative group"
        aria-label="View on Instagram"
      >
        {photos.map((photo, i) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))}
        {/* Instagram hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      </a>

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 8000); }}
            aria-label={`Go to photo ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width:  i === current ? "20px" : "8px",
              height: "8px",
              background: i === current ? "#FCFF66" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* Counter */}
      <p className="text-center text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">
        {current + 1} / {photos.length}
      </p>
    </div>
  );
}
