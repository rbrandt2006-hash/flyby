import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star, MapPin, Wifi, Dumbbell, Coffee, Car, Utensils, Wine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Default placeholder hotel images
const DEFAULT_HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=500&fit=crop",
];

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="w-4 h-4" />,
  "Wifi": <Wifi className="w-4 h-4" />,
  "Gym": <Dumbbell className="w-4 h-4" />,
  "Fitness Center": <Dumbbell className="w-4 h-4" />,
  "Pool": <Sparkles className="w-4 h-4" />,
  "Free Breakfast": <Coffee className="w-4 h-4" />,
  "Breakfast": <Coffee className="w-4 h-4" />,
  "Valet Parking": <Car className="w-4 h-4" />,
  "Parking": <Car className="w-4 h-4" />,
  "Restaurant": <Utensils className="w-4 h-4" />,
  "Bar": <Wine className="w-4 h-4" />,
};

export interface HotelInfo {
  name: string;
  location?: string;
  address?: string;
  rating?: number;
  pricePerNight?: number;
  amenities?: string[];
  images?: string[];
  description?: string;
  reviewCount?: number;
}

interface HotelDetailModalProps {
  hotel: HotelInfo;
  isOpen: boolean;
  onClose: () => void;
  onChangeHotel?: () => void;
  nights?: number;
}

export function HotelDetailModal({ 
  hotel, 
  isOpen, 
  onClose, 
  onChangeHotel,
  nights = 1 
}: HotelDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use hotel images or default placeholders
  const images = hotel.images?.length ? hotel.images : DEFAULT_HOTEL_IMAGES;
  
  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Image Carousel */}
            <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    e.currentTarget.src = DEFAULT_HOTEL_IMAGES[0];
                  }}
                />
              </AnimatePresence>
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              
              {/* Image indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx === currentImageIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              )}
              
              {/* Image count badge */}
              <Badge 
                variant="secondary" 
                className="absolute bottom-3 right-3 bg-black/50 text-white border-0"
              >
                {currentImageIndex + 1} / {images.length}
              </Badge>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Header */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{hotel.name}</h2>
                
                <div className="flex items-center gap-3 text-sm">
                  {hotel.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{hotel.rating.toFixed(1)}</span>
                      {hotel.reviewCount && (
                        <span className="text-muted-foreground">
                          ({hotel.reviewCount.toLocaleString()} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {(hotel.location || hotel.address) && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{hotel.address || hotel.location}</span>
                  </div>
                )}
              </div>
              
              {/* Price */}
              {hotel.pricePerNight && (
                <div className="p-4 bg-muted/40 rounded-xl">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">
                        ${hotel.pricePerNight}
                      </span>
                      <span className="text-muted-foreground text-sm"> /night</span>
                    </div>
                    {nights > 1 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{nights} nights total</p>
                        <p className="font-semibold text-foreground">
                          ${(hotel.pricePerNight * nights).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Amenities */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity) => (
                      <Badge 
                        key={amenity} 
                        variant="secondary"
                        className="gap-1.5 py-1.5 px-3"
                      >
                        {amenityIcons[amenity] || null}
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              {hotel.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {hotel.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-border flex gap-3">
              {onChangeHotel && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    onChangeHotel();
                  }}
                >
                  Change hotel
                </Button>
              )}
              <Button 
                variant="default" 
                className="flex-1"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
