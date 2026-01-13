import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hotel, MapPin, Star, ChevronLeft, Wifi, Dumbbell, Coffee, Car, Utensils, Waves, Check, Sparkles, Calendar, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import type { HotelOption } from "./types";

interface HotelBrowserDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: HotelOption[];
  selectedHotel: HotelOption | null;
  onSelect: (hotel: HotelOption) => void;
  nights: number;
  venueName?: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="w-4 h-4" />,
  "Gym": <Dumbbell className="w-4 h-4" />,
  "Fitness center": <Dumbbell className="w-4 h-4" />,
  "Pool": <Waves className="w-4 h-4" />,
  "Breakfast included": <Coffee className="w-4 h-4" />,
  "Parking": <Car className="w-4 h-4" />,
  "Valet parking": <Car className="w-4 h-4" />,
  "Restaurant": <Utensils className="w-4 h-4" />,
  "Fine dining": <Utensils className="w-4 h-4" />,
};

export function HotelBrowserDrawer({
  open,
  onOpenChange,
  hotels,
  selectedHotel,
  onSelect,
  nights,
  venueName = "Moscone Center",
}: HotelBrowserDrawerProps) {
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

  const handleClose = () => {
    setDetailHotel(null);
    onOpenChange(false);
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-background shadow-2xl flex flex-col",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]"
                : "right-0 top-0 h-full w-full max-w-lg border-l"
            )}
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>
            )}

            <AnimatePresence mode="wait">
              {!detailHotel ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <div className="sticky top-0 z-10 shrink-0 px-5 py-4 border-b border-border/40 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">Choose a hotel</h2>
                          <p className="text-sm text-muted-foreground">
                            {nights} night{nights !== 1 ? 's' : ''} • Near {venueName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {hotels.map((hotel) => {
                      const priceDiff = hotel.totalPrice - (selectedHotel?.totalPrice || hotels[0].totalPrice);
                      
                      return (
                        <button
                          key={hotel.id}
                          onClick={() => handleViewDetail(hotel)}
                          className={cn(
                            "w-full rounded-xl border text-left transition-all overflow-hidden group",
                            selectedHotel?.id === hotel.id
                              ? "border-primary/30 ring-2 ring-primary/20"
                              : "border-border/60 hover:border-primary/30 hover:shadow-md"
                          )}
                        >
                          <div className="relative h-36 bg-muted">
                            <img
                              src={hotel.images[0]}
                              alt={hotel.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="font-semibold text-white text-lg">{hotel.name}</p>
                              <div className="flex items-center gap-1 text-white/80 text-sm">
                                <MapPin className="w-3 h-3" />
                                <span>{hotel.distanceToVenue} from {venueName}</span>
                              </div>
                            </div>
                            {hotel.tags.includes("Recommended") && (
                              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="font-semibold">{hotel.rating}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  ({hotel.reviewCount.toLocaleString()} reviews)
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">${hotel.totalPrice}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    ${hotel.pricePerNight}/night
                                  </span>
                                  {priceDiff !== 0 && selectedHotel && (
                                    <span className={cn(
                                      "text-xs font-medium",
                                      priceDiff < 0 ? "text-green-600" : "text-orange-600"
                                    )}>
                                      ({priceDiff > 0 ? "+" : ""}{priceDiff})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {hotel.tags.filter(t => t !== "Recommended").slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
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
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

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
                            src={detailHotel.images[currentImageIndex]}
                            alt={`${detailHotel.name} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </AnimatePresence>
                      </div>
                      
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {detailHotel.images.map((_, i) => (
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

                      <div className="flex gap-2 p-3 bg-muted/30">
                        {detailHotel.images.map((img, i) => (
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
                          <span className="text-muted-foreground">({detailHotel.reviewCount.toLocaleString()} reviews)</span>
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
                        <span>{detailHotel.area} • {detailHotel.distanceToVenue} to {venueName}</span>
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
                          {detailHotel.description}
                        </p>
                      </div>

                      {/* Room types */}
                      <div>
                        <h3 className="font-semibold mb-3">Room Types</h3>
                        <div className="flex flex-wrap gap-2">
                          {detailHotel.roomTypes.map((room) => (
                            <div key={room} className="px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                              {room}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Amenities */}
                      <div>
                        <h3 className="font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {detailHotel.amenities.map((amenity) => (
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

                      {/* Cancellation policy */}
                      <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">Cancellation Policy</p>
                            <p className="text-sm text-green-600 dark:text-green-400">{detailHotel.cancellationPolicy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-background">
                    <Button
                      className="w-full h-11 rounded-xl"
                      onClick={() => handleSelect(detailHotel)}
                    >
                      Select {detailHotel.name}
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
