import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotelPhotoCarouselProps {
  images: string[];
  hotelName: string;
  className?: string;
  compact?: boolean;
}

export function HotelPhotoCarousel({ 
  images, 
  hotelName, 
  className,
  compact = false 
}: HotelPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const hasImages = images && images.length > 0;
  const validImages = hasImages ? images.filter((_, i) => !imageError.has(i)) : [];
  const showImages = validImages.length > 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  if (!showImages) {
    return (
      <div className={cn(
        "bg-muted flex flex-col items-center justify-center text-muted-foreground",
        compact ? "h-20 rounded-lg" : "h-32 rounded-xl",
        className
      )}>
        <ImageOff className={cn(compact ? "w-5 h-5" : "w-8 h-8", "mb-1")} />
        <span className={cn(compact ? "text-xs" : "text-sm")}>No photos available</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden bg-muted group",
      compact ? "h-20 rounded-lg" : "h-32 rounded-xl",
      className
    )}>
      {/* Main image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          src={validImages[currentIndex]}
          alt={`${hotelName} - Photo ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={() => handleImageError(currentIndex)}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Navigation arrows */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60",
              compact ? "p-0.5" : "p-1"
            )}
          >
            <ChevronLeft className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
          </button>
          <button
            onClick={handleNext}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60",
              compact ? "p-0.5" : "p-1"
            )}
          >
            <ChevronRight className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {validImages.length > 1 && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 flex gap-1",
          compact ? "bottom-1" : "bottom-2"
        )}>
          {validImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={cn(
                "rounded-full transition-all",
                compact ? "w-1 h-1" : "w-1.5 h-1.5",
                i === currentIndex
                  ? "bg-white w-3"
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      <div className={cn(
        "absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded",
        compact ? "text-[10px]" : "text-xs"
      )}>
        {currentIndex + 1}/{validImages.length}
      </div>
    </div>
  );
}
