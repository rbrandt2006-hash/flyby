import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hotel, MapPin, Star, ChevronLeft, Wifi, Dumbbell, Coffee, Car, Utensils, Waves, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";

interface HotelOption {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  distanceToVenue: string;
  tags: string[];
  // Extended properties for detail view
  images?: string[];
  amenities?: string[];
  reviewCount?: number;
  description?: string;
}

interface HotelChooserDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: HotelOption[];
  selectedHotel: HotelOption | null;
  onSelect: (hotel: HotelOption) => void;
  nights: number;
}

// Mock hotel images (placeholder gradients)
const hotelImages: Record<string, string[]> = {
  "h1": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
  ],
  "h2": [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
  ],
  "h3": [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
  ],
  "h4": [
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
  ],
};

const hotelAmenities: Record<string, string[]> = {
  "h1": ["Free Wi-Fi", "Gym", "Pool", "Breakfast included", "Parking", "Room service"],
  "h2": ["Free Wi-Fi", "Gym", "Business center", "Restaurant", "Parking"],
  "h3": ["Free Wi-Fi", "Breakfast included", "Parking", "Laundry"],
  "h4": ["Free Wi-Fi", "Gym", "Pool", "Spa", "Restaurant", "Concierge", "Parking"],
};

const hotelDescriptions: Record<string, string> = {
  "h1": "Experience luxury in the heart of downtown. The Westin offers stunning city views, world-class amenities, and is steps away from major business centers and attractions.",
  "h2": "Modern comfort meets convenience at the Marriott. Ideal for business travelers with excellent meeting facilities and a prime Financial District location.",
  "h3": "Affordable elegance at the Hilton Garden Inn. Enjoy complimentary breakfast and easy access to the Convention Center for your business needs.",
  "h4": "Elevate your stay at the Hyatt Regency. Premium accommodations with executive amenities, perfect for the discerning business traveler.",
};

const amenityIcons: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="w-4 h-4" />,
  "Gym": <Dumbbell className="w-4 h-4" />,
  "Pool": <Waves className="w-4 h-4" />,
  "Breakfast included": <Coffee className="w-4 h-4" />,
  "Parking": <Car className="w-4 h-4" />,
  "Restaurant": <Utensils className="w-4 h-4" />,
};

export function HotelChooserDrawer({
  open,
  onOpenChange,
  hotels,
  selectedHotel,
  onSelect,
  nights,
}: HotelChooserDrawerProps) {
  const isMobile = useIsMobile();
  const [detailHotel, setDetailHotel] = useState<HotelOption | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSelect = (hotel: HotelOption) => {
    onSelect(hotel);
    setDetailHotel(null);
    onOpenChange(false);
  };

  const handleViewDetail = (hotel: HotelOption) => {
    setDetailHotel(hotel);
    setCurrentImageIndex(0);
  };

  const handleBack = () => {
    setDetailHotel(null);
  };

  const getHotelImages = (hotelId: string) => hotelImages[hotelId] || hotelImages["h1"];
  const getHotelAmenities = (hotelId: string) => hotelAmenities[hotelId] || hotelAmenities["h1"];
  const getHotelDescription = (hotelId: string) => hotelDescriptions[hotelId] || hotelDescriptions["h1"];

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setDetailHotel(null); onOpenChange(false); }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer/Sheet */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-background shadow-2xl flex flex-col",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]"
                : "right-0 top-0 h-full w-full max-w-md border-l"
            )}
          >
            {/* Handle for mobile */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>
            )}

            <AnimatePresence mode="wait">
              {!detailHotel ? (
                /* Hotel List View */
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Header */}
                  <div className="sticky top-0 z-10 shrink-0 px-5 py-4 border-b border-border/40 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">Choose a hotel</h2>
                          <p className="text-sm text-muted-foreground">
                            {nights} night{nights !== 1 ? 's' : ''} • {hotels.length} options
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Hotel list */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {hotels.map((hotel) => (
                      <button
                        key={hotel.id}
                        onClick={() => handleViewDetail(hotel)}
                        className={cn(
                          "w-full rounded-xl border text-left transition-all overflow-hidden",
                          selectedHotel?.id === hotel.id
                            ? "border-primary/30 ring-2 ring-primary/20"
                            : "border-border/60 hover:border-primary/30 hover:shadow-md"
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-32 bg-muted">
                          <img
                            src={getHotelImages(hotel.id)[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                          {hotel.tags.includes("Policy compliant") && (
                            <Badge className="absolute top-2 left-2 bg-success text-success-foreground text-[10px]">
                              Policy compliant
                            </Badge>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{hotel.name}</p>
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{hotel.area}</span>
                                <span>•</span>
                                <span>{hotel.distanceToVenue} to venue</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-primary">${hotel.totalPrice}</p>
                              <p className="text-xs text-muted-foreground">${hotel.pricePerNight}/night</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="font-medium">{hotel.rating}</span>
                              <span className="text-muted-foreground">(128 reviews)</span>
                            </div>
                            <div className="flex gap-1.5">
                              {hotel.tags.filter(t => t !== "Policy compliant").slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* Hotel Detail View */
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Header */}
                  <div className="sticky top-0 z-10 shrink-0 px-5 py-4 border-b border-border/40 bg-background">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-foreground truncate">{detailHotel.name}</h2>
                        <p className="text-sm text-muted-foreground">{detailHotel.area}</p>
                      </div>
                      <button
                        onClick={() => { setDetailHotel(null); onOpenChange(false); }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Detail content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Photo gallery */}
                    <div className="relative">
                      <div className="relative h-56 bg-muted overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            src={getHotelImages(detailHotel.id)[currentImageIndex]}
                            alt={`${detailHotel.name} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </AnimatePresence>
                      </div>
                      
                      {/* Image dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {getHotelImages(detailHotel.id).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all",
                              i === currentImageIndex
                                ? "bg-white w-4"
                                : "bg-white/50 hover:bg-white/75"
                            )}
                          />
                        ))}
                      </div>

                      {/* Thumbnail strip */}
                      <div className="flex gap-2 p-3 bg-muted/30">
                        {getHotelImages(detailHotel.id).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={cn(
                              "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                              i === currentImageIndex
                                ? "border-primary"
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-5">
                      {/* Rating & Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-lg">{detailHotel.rating}</span>
                          </div>
                          <span className="text-muted-foreground">(128 reviews)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">${detailHotel.totalPrice}</p>
                          <p className="text-sm text-muted-foreground">
                            ${detailHotel.pricePerNight}/night × {nights} night{nights !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{detailHotel.area} • {detailHotel.distanceToVenue} to venue</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {detailHotel.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tag === "Recommended" || tag === "Policy compliant" ? "default" : "outline"}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="font-semibold mb-2">About</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {getHotelDescription(detailHotel.id)}
                        </p>
                      </div>

                      {/* Amenities */}
                      <div>
                        <h3 className="font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {getHotelAmenities(detailHotel.id).map((amenity) => (
                            <div
                              key={amenity}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                            >
                              {amenityIcons[amenity] || <Check className="w-4 h-4" />}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-background">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleSelect(detailHotel)}
                    >
                      Select this hotel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
