import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hotel, Search, MapPin, Star, ChevronLeft, Wifi, Dumbbell, Coffee, ImageOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HotelOption } from "@/components/chats/booking/types";

interface TripHotelPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: HotelOption[];
  selectedHotel: HotelOption | null;
  onSelect: (hotel: HotelOption) => void;
  nights: number;
}

const amenityIcons: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="w-3.5 h-3.5" />,
  "Gym": <Dumbbell className="w-3.5 h-3.5" />,
  "Fitness center": <Dumbbell className="w-3.5 h-3.5" />,
  "Breakfast included": <Coffee className="w-3.5 h-3.5" />,
};

export function TripHotelPicker({
  open,
  onOpenChange,
  hotels,
  selectedHotel,
  onSelect,
  nights,
}: TripHotelPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailHotel, setDetailHotel] = useState<HotelOption | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredHotels = useMemo(() => {
    if (!searchQuery.trim()) return hotels;
    const query = searchQuery.toLowerCase();
    return hotels.filter(h => 
      h.name.toLowerCase().includes(query) ||
      h.area.toLowerCase().includes(query)
    );
  }, [hotels, searchQuery]);

  const handleSelectHotel = (hotel: HotelOption) => {
    onSelect(hotel);
    setDetailHotel(null);
    setSearchQuery("");
  };

  const handleViewDetail = (hotel: HotelOption) => {
    setDetailHotel(hotel);
    setCurrentImageIndex(0);
  };

  const handleBack = () => {
    setDetailHotel(null);
    setCurrentImageIndex(0);
  };

  const handleClose = () => {
    setDetailHotel(null);
    setSearchQuery("");
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
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[60] w-auto sm:w-full sm:max-w-lg bg-background rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
          >
            <AnimatePresence mode="wait">
              {detailHotel ? (
                // Detail view
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  {/* Detail Header */}
                  <div className="shrink-0 px-5 py-4 border-b border-border flex items-center gap-3">
                    <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-muted">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate">{detailHotel.name}</h2>
                      <p className="text-sm text-muted-foreground truncate">{detailHotel.area}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Photo carousel */}
                  <div className="relative h-48 bg-muted">
                    {detailHotel.images.length > 0 ? (
                      <>
                        <img
                          src={detailHotel.images[currentImageIndex]}
                          alt={`${detailHotel.name} photo ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {detailHotel.images.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex(i => i === 0 ? detailHotel.images.length - 1 : i - 1)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex(i => i === detailHotel.images.length - 1 ? 0 : i + 1)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {detailHotel.images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentImageIndex(i)}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                                  )}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                          {currentImageIndex + 1}/{detailHotel.images.length}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ImageOff className="w-10 h-10 mb-2" />
                        <p className="text-sm">Photos unavailable</p>
                      </div>
                    )}
                  </div>

                  {/* Detail content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{detailHotel.rating}</span>
                        <span className="text-sm text-muted-foreground">({detailHotel.reviewCount.toLocaleString()} reviews)</span>
                      </div>
                      <Badge variant="secondary">{detailHotel.distanceToVenue} to venue</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{detailHotel.description}</p>

                    <div>
                      <p className="text-sm font-medium mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {detailHotel.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs">
                            {amenityIcons[amenity] || null}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Cancellation</p>
                      <p className="text-sm">{detailHotel.cancellationPolicy}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 p-4 border-t border-border bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-2xl font-bold">${detailHotel.pricePerNight * nights}</span>
                        <span className="text-sm text-muted-foreground ml-1">total</span>
                      </div>
                      <span className="text-sm text-muted-foreground">${detailHotel.pricePerNight}/night × {nights}</span>
                    </div>
                    <Button 
                      className="w-full bg-cta hover:bg-cta-hover text-cta-foreground"
                      onClick={() => handleSelectHotel(detailHotel)}
                    >
                      Select this hotel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                // List view
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="shrink-0 px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Change hotel</h2>
                          <p className="text-sm text-muted-foreground">{nights} nights</p>
                        </div>
                      </div>
                      <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted">
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hotel or neighborhood..."
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Hotel list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredHotels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hotels found</p>
                      </div>
                    ) : (
                      filteredHotels.map((hotel) => {
                        const isSelected = selectedHotel?.id === hotel.id;
                        const thumbnailUrl = hotel.images[0];
                        return (
                          <button
                            key={hotel.id}
                            onClick={() => handleViewDetail(hotel)}
                            className={cn(
                              "w-full p-3 rounded-xl border text-left transition-all flex gap-3",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-primary/30 hover:bg-muted/30"
                            )}
                          >
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                              {thumbnailUrl ? (
                                <img src={thumbnailUrl} alt={hotel.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ImageOff className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm truncate">{hotel.name}</h3>
                                <div className="text-right shrink-0">
                                  <p className="font-bold">${hotel.pricePerNight * nights}</p>
                                  <p className="text-[10px] text-muted-foreground">${hotel.pricePerNight}/night</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{hotel.area}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span className="text-xs font-medium">{hotel.rating}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{hotel.distanceToVenue}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
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
