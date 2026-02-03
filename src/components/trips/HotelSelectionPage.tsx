import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  Hotel, 
  MapPin, 
  Star, 
  ChevronLeft,
  ChevronRight,
  Wifi, 
  Dumbbell, 
  Coffee, 
  Car, 
  Utensils, 
  Waves, 
  Check,
  Sparkles,
  X,
  ImageOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HotelOption } from "@/components/chats/booking/types";

interface HotelSelectionPageProps {
  open: boolean;
  onClose: () => void;
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

export function HotelSelectionPage({
  open,
  onClose,
  hotels,
  selectedHotel,
  onSelect,
  nights,
  venueName = "venue",
}: HotelSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailHotel, setDetailHotel] = useState<HotelOption | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredHotels = useMemo(() => {
    if (!searchQuery.trim()) return hotels;
    const query = searchQuery.toLowerCase();
    return hotels.filter(h => 
      h.name.toLowerCase().includes(query) ||
      h.area.toLowerCase().includes(query) ||
      h.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [hotels, searchQuery]);

  const handleSelectHotel = (hotel: HotelOption) => {
    onSelect(hotel);
    setDetailHotel(null);
    setSearchQuery("");
    onClose();
  };

  const handleViewDetail = (hotel: HotelOption) => {
    setDetailHotel(hotel);
    setCurrentImageIndex(0);
  };

  const handleBackFromDetail = () => {
    setDetailHotel(null);
    setCurrentImageIndex(0);
  };

  const handleClose = () => {
    setDetailHotel(null);
    setSearchQuery("");
    onClose();
  };

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          <AnimatePresence mode="wait">
            {detailHotel ? (
              // Detail View
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Detail Header */}
                <div className="sticky top-0 z-20 shrink-0 px-4 sm:px-6 py-4 border-b border-border bg-background">
                  <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                      onClick={handleBackFromDetail}
                      className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-semibold truncate">{detailHotel.name}</h1>
                      <p className="text-sm text-muted-foreground truncate">{detailHotel.area}</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    {/* Photo carousel */}
                    <div className="relative aspect-video bg-muted">
                      {detailHotel.images.length > 0 ? (
                        <>
                          <motion.img
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            src={detailHotel.images[currentImageIndex]}
                            alt={`${detailHotel.name} photo ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {detailHotel.images.length > 1 && (
                            <>
                              <button
                                onClick={() => setCurrentImageIndex(i => i === 0 ? detailHotel.images.length - 1 : i - 1)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setCurrentImageIndex(i => i === detailHotel.images.length - 1 ? 0 : i + 1)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {detailHotel.images.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={cn(
                                      "w-2 h-2 rounded-full transition-all",
                                      i === currentImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75"
                                    )}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                            {currentImageIndex + 1} / {detailHotel.images.length}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <ImageOff className="w-12 h-12 mb-2" />
                          <p>No photos available</p>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {detailHotel.images.length > 1 && (
                      <div className="flex gap-2 p-4 bg-muted/30 overflow-x-auto">
                        {detailHotel.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={cn(
                              "w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                              i === currentImageIndex
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Detail info */}
                    <div className="p-4 sm:p-6 space-y-6">
                      {/* Rating & Price */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-xl font-bold">{detailHotel.rating}</span>
                          </div>
                          <span className="text-muted-foreground">
                            ({detailHotel.reviewCount.toLocaleString()} reviews)
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">${detailHotel.totalPrice}</p>
                          <p className="text-sm text-muted-foreground">
                            ${detailHotel.pricePerNight}/night × {nights} night{nights !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Location & Distance */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{detailHotel.area} • {detailHotel.distanceToVenue} to {venueName}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {detailHotel.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tag === "Recommended" || tag === "Policy compliant" ? "default" : "outline"}
                            className="text-sm"
                          >
                            {tag === "Recommended" && <Sparkles className="w-3 h-3 mr-1" />}
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="font-semibold mb-2">About this hotel</h3>
                        <p className="text-muted-foreground leading-relaxed">{detailHotel.description}</p>
                      </div>

                      {/* Room types */}
                      <div>
                        <h3 className="font-semibold mb-3">Room Types</h3>
                        <div className="flex flex-wrap gap-2">
                          {detailHotel.roomTypes.map((room) => (
                            <div key={room} className="px-3 py-1.5 rounded-lg bg-muted text-sm">
                              {room}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Amenities */}
                      <div>
                        <h3 className="font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {detailHotel.amenities.map((amenity) => (
                            <div
                              key={amenity}
                              className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm"
                            >
                              {amenityIcons[amenity] || <Check className="w-4 h-4" />}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cancellation policy */}
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                          Cancellation Policy
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {detailHotel.cancellationPolicy}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail Footer */}
                <div className="sticky bottom-0 shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-background">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-bold">${detailHotel.totalPrice}</p>
                      <p className="text-sm text-muted-foreground">Total for {nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-cta hover:bg-cta-hover text-cta-foreground"
                      onClick={() => handleSelectHotel(detailHotel)}
                    >
                      Select this hotel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // List View
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 shrink-0 bg-background border-b border-border">
                  <div className="px-4 sm:px-6 py-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={handleClose}
                          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          <span className="text-sm font-medium hidden sm:inline">Back to trip</span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Hotel className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h1 className="text-lg sm:text-xl font-semibold truncate">Choose a hotel</h1>
                              <p className="text-sm text-muted-foreground">
                                {nights} night{nights !== 1 ? 's' : ''} • {hotels.length} option{hotels.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Search bar */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search hotel name, brand, or neighborhood"
                          className="pl-12 h-12 text-base rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hotel Grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                    {filteredHotels.length === 0 ? (
                      <div className="text-center py-16">
                        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">No matches found</h3>
                        <p className="text-muted-foreground">
                          Try a different search term or browse all options
                        </p>
                        {searchQuery && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {filteredHotels.map((hotel) => {
                          const isSelected = selectedHotel?.id === hotel.id;
                          const thumbnailUrl = hotel.images[0];
                          const priceDiff = selectedHotel 
                            ? hotel.totalPrice - selectedHotel.totalPrice 
                            : 0;

                          return (
                            <motion.button
                              key={hotel.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => handleViewDetail(hotel)}
                              className={cn(
                                "w-full rounded-2xl border text-left transition-all overflow-hidden group",
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/30 hover:shadow-lg"
                              )}
                            >
                              {/* Large Image */}
                              <div className="relative h-48 bg-muted">
                                {thumbnailUrl ? (
                                  <img
                                    src={thumbnailUrl}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <ImageOff className="w-10 h-10" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                
                                {/* Badges on image */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                  {hotel.tags.includes("Recommended") && (
                                    <Badge className="bg-primary text-primary-foreground">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Recommended
                                    </Badge>
                                  )}
                                  {hotel.tags.includes("Policy compliant") && (
                                    <Badge className="bg-success text-success-foreground text-xs">
                                      Policy compliant
                                    </Badge>
                                  )}
                                </div>

                                {/* Price overlay */}
                                <div className="absolute bottom-3 right-3 text-right">
                                  <p className="text-2xl font-bold text-white">${hotel.totalPrice}</p>
                                  <p className="text-xs text-white/80">${hotel.pricePerNight}/night</p>
                                </div>

                                {/* Hotel name overlay */}
                                <div className="absolute bottom-3 left-3 right-20">
                                  <p className="font-semibold text-white text-lg truncate">{hotel.name}</p>
                                </div>

                                {/* Selected check */}
                                {isSelected && (
                                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-4 h-4 text-primary-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Card content */}
                              <div className="p-4">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{hotel.area}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{hotel.distanceToVenue} to {venueName}</span>
                                </div>

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
                                  {priceDiff !== 0 && selectedHotel && (
                                    <span className={cn(
                                      "text-sm font-medium",
                                      priceDiff < 0 ? "text-green-600" : "text-orange-600"
                                    )}>
                                      {priceDiff > 0 ? "+" : ""}{priceDiff}
                                    </span>
                                  )}
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {hotel.tags
                                    .filter(t => t !== "Recommended" && t !== "Policy compliant")
                                    .slice(0, 3)
                                    .map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
