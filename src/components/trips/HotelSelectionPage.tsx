import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Hotel,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wifi,
  Dumbbell,
  Coffee,
  Car,
  Utensils,
  Waves,
  Check,
  Sparkles,
  X,
  ImageOff,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Gym: <Dumbbell className="w-4 h-4" />,
  "Fitness center": <Dumbbell className="w-4 h-4" />,
  Pool: <Waves className="w-4 h-4" />,
  "Rooftop pool": <Waves className="w-4 h-4" />,
  "Breakfast included": <Coffee className="w-4 h-4" />,
  "Free breakfast": <Coffee className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />,
  "Valet parking": <Car className="w-4 h-4" />,
  Restaurant: <Utensils className="w-4 h-4" />,
  "Fine dining": <Utensils className="w-4 h-4" />,
};

type SortOption = "recommended" | "price-asc" | "price-desc" | "rating" | "distance";

const PAGE_SIZE = 24;

function parseDistance(d: string): number {
  return parseFloat(d) || 99;
}

// Lazy image component
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("bg-muted", className)}>
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}

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

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(10);
  const [policyOnly, setPolicyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  // Progressive loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Compute price bounds for slider
  const priceBounds = useMemo(() => {
    if (!hotels.length) return { min: 0, max: 1000 };
    const prices = hotels.map((h) => h.pricePerNight);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [hotels]);

  // Reset filters when hotels change
  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setVisibleCount(PAGE_SIZE);
  }, [priceBounds]);

  // Filter + sort
  const processedHotels = useMemo(() => {
    let list = hotels;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.area.toLowerCase().includes(q) ||
          h.tags.some((t) => t.toLowerCase().includes(q)) ||
          h.amenities.some((a) => a.toLowerCase().includes(q))
      );
    }

    // Price
    list = list.filter((h) => h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]);

    // Rating
    if (minRating > 0) list = list.filter((h) => h.rating >= minRating);

    // Distance
    if (maxDistance < 10) list = list.filter((h) => parseDistance(h.distanceToVenue) <= maxDistance);

    // Policy
    if (policyOnly) list = list.filter((h) => h.tags.includes("Policy compliant"));

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        sorted.sort((a, b) => parseDistance(a.distanceToVenue) - parseDistance(b.distanceToVenue));
        break;
      default: // recommended
        sorted.sort((a, b) => {
          const aR = a.tags.includes("Recommended") ? 0 : 1;
          const bR = b.tags.includes("Recommended") ? 0 : 1;
          if (aR !== bR) return aR - bR;
          const aOut = a.tags.includes("Out of policy") ? 1 : 0;
          const bOut = b.tags.includes("Out of policy") ? 1 : 0;
          if (aOut !== bOut) return aOut - bOut;
          return b.rating - a.rating;
        });
    }
    return sorted;
  }, [hotels, searchQuery, priceRange, minRating, maxDistance, policyOnly, sortBy]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, priceRange, minRating, maxDistance, policyOnly, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, processedHotels.length));
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [processedHotels.length]);

  const visibleHotels = processedHotels.slice(0, visibleCount);
  const hasMore = visibleCount < processedHotels.length;

  const activeFilterCount = [
    priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max,
    minRating > 0,
    maxDistance < 10,
    policyOnly,
  ].filter(Boolean).length;

  const handleSelectHotel = (hotel: HotelOption) => {
    // Notify parent — do NOT call onClose() here. onClose is the "cancel"
    // path; the parent dismisses this page itself once it processes the
    // selection. Calling both races with the parent's state updates and
    // can clobber the just-selected hotel.
    onSelect(hotel);
    setDetailHotel(null);
    setSearchQuery("");
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

  const clearFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setMinRating(0);
    setMaxDistance(10);
    setPolicyOnly(false);
    setSortBy("recommended");
  };

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 top-16 bottom-16 md:bottom-0 z-40 bg-background flex flex-col"
        >
          <AnimatePresence mode="wait">
            {detailHotel ? (
              /* ── Detail View ─────────────────────────────── */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="sticky top-0 z-20 shrink-0 px-4 sm:px-6 py-4 border-b border-border bg-background">
                  <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={handleBackFromDetail} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-semibold truncate">{detailHotel.name}</h1>
                      <p className="text-sm text-muted-foreground truncate">{detailHotel.area}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

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
                                onClick={() => setCurrentImageIndex((i) => (i === 0 ? detailHotel.images.length - 1 : i - 1))}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setCurrentImageIndex((i) => (i === detailHotel.images.length - 1 ? 0 : i + 1))}
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

                    {/* Thumbnails */}
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

                    <div className="p-4 sm:p-6 space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-xl font-bold">{detailHotel.rating}</span>
                          </div>
                          <span className="text-muted-foreground">({detailHotel.reviewCount.toLocaleString()} reviews)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">${detailHotel.totalPrice}</p>
                          <p className="text-sm text-muted-foreground">
                            ${detailHotel.pricePerNight}/night × {nights} night{nights !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>
                          {detailHotel.area} • {detailHotel.distanceToVenue} to {venueName}
                        </span>
                      </div>

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

                      <div>
                        <h3 className="font-semibold mb-2">About this hotel</h3>
                        <p className="text-muted-foreground leading-relaxed">{detailHotel.description}</p>
                      </div>

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

                      <div>
                        <h3 className="font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {detailHotel.amenities.map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm">
                              {amenityIcons[amenity] || <Check className="w-4 h-4" />}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Cancellation Policy</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{detailHotel.cancellationPolicy}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-background">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-bold">${detailHotel.totalPrice}</p>
                      <p className="text-sm text-muted-foreground">
                        Total for {nights} night{nights !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button size="lg" className="bg-cta hover:bg-cta-hover text-cta-foreground" onClick={() => handleSelectHotel(detailHotel)}>
                      Select this hotel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── List View ───────────────────────────────── */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="sticky top-0 z-20 shrink-0 bg-background border-b border-border">
                  <div className="px-4 sm:px-6 py-4">
                    <div className="max-w-5xl mx-auto">
                      {/* Top row */}
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
                                {nights} night{nights !== 1 ? "s" : ""} •{" "}
                                {processedHotels.length} result{processedHotels.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Search + filter row */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, brand, or neighborhood…"
                            className="pl-12 h-12 text-base rounded-xl"
                          />
                        </div>
                        <Button
                          variant={showFilters ? "default" : "outline"}
                          size="lg"
                          className="h-12 px-4 rounded-xl gap-2 shrink-0"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          <span className="hidden sm:inline">Filters</span>
                          {activeFilterCount > 0 && (
                            <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {activeFilterCount}
                            </span>
                          )}
                        </Button>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                          <SelectTrigger className="h-12 w-[160px] rounded-xl shrink-0 hidden sm:flex">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recommended">Recommended</SelectItem>
                            <SelectItem value="price-asc">Price: Low → High</SelectItem>
                            <SelectItem value="price-desc">Price: High → Low</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="distance">Distance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter panel */}
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 pb-2 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Price range */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Price/night: ${priceRange[0]} – ${priceRange[1]}
                                  </label>
                                  <Slider
                                    value={priceRange}
                                    min={priceBounds.min}
                                    max={priceBounds.max}
                                    step={10}
                                    onValueChange={(v) => setPriceRange(v as [number, number])}
                                    className="py-2"
                                  />
                                </div>

                                {/* Rating */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Min rating: {minRating > 0 ? `${minRating}+` : "Any"}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {[0, 3.5, 4.0, 4.5].map((r) => (
                                      <button
                                        key={r}
                                        onClick={() => setMinRating(r)}
                                        className={cn(
                                          "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                          minRating === r
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted/80"
                                        )}
                                      >
                                        {r === 0 ? "Any" : `${r}+`}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Distance */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Max distance: {maxDistance >= 10 ? "Any" : `${maxDistance} mi`}
                                  </label>
                                  <Slider
                                    value={[maxDistance]}
                                    min={0.5}
                                    max={10}
                                    step={0.5}
                                    onValueChange={([v]) => setMaxDistance(v)}
                                    className="py-2"
                                  />
                                </div>

                                {/* Policy toggle */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Policy compliant only</label>
                                  <div className="flex items-center gap-3 pt-1">
                                    <Switch checked={policyOnly} onCheckedChange={setPolicyOnly} />
                                    <span className="text-sm">{policyOnly ? "On" : "Off"}</span>
                                  </div>
                                </div>
                              </div>

                              {activeFilterCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                                  Clear all filters
                                </Button>
                              )}

                              {/* Mobile sort */}
                              <div className="sm:hidden">
                                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                  <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue placeholder="Sort by" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="recommended">Recommended</SelectItem>
                                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="distance">Distance</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Hotel Grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {processedHotels.length === 0 ? (
                      <div className="text-center py-16">
                        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">No matches found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                        <div className="flex gap-2 justify-center mt-4">
                          {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                              Clear search
                            </Button>
                          )}
                          {activeFilterCount > 0 && (
                            <Button variant="outline" onClick={clearFilters}>
                              Reset filters
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleHotels.map((hotel) => {
                            const isSelected = selectedHotel?.id === hotel.id;
                            const thumbnailUrl = hotel.images[0];

                            return (
                              <motion.div
                                key={hotel.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                whileTap={{ scale: 0.98 }}
                                tabIndex={0}
                                onClick={() => handleViewDetail(hotel)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleViewDetail(hotel);
                                  }
                                }}
                                className={cn(
                                  "w-full rounded-2xl border text-left transition-all overflow-hidden group cursor-pointer",
                                  isSelected
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/30 hover:shadow-lg"
                                )}
                              >
                                {/* Image */}
                                <div className="relative h-44 bg-muted overflow-hidden">
                                  {thumbnailUrl ? (
                                    <LazyImage
                                      src={thumbnailUrl}
                                      alt={hotel.name}
                                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      <ImageOff className="w-10 h-10" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                    {hotel.tags.includes("Recommended") && (
                                      <Badge className="bg-primary text-primary-foreground text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Recommended
                                      </Badge>
                                    )}
                                    {hotel.tags.includes("Policy compliant") && (
                                      <Badge className="bg-success text-success-foreground text-xs">Policy compliant</Badge>
                                    )}
                                    {hotel.tags.includes("Out of policy") && (
                                      <Badge className="bg-destructive text-destructive-foreground text-xs">Out of policy</Badge>
                                    )}
                                  </div>

                                  <div className="absolute bottom-3 right-3 text-right">
                                    <p className="text-xl font-bold text-white">${hotel.totalPrice}</p>
                                    <p className="text-xs text-white/80">${hotel.pricePerNight}/night</p>
                                  </div>

                                  <div className="absolute bottom-3 left-3 right-20">
                                    <p className="font-semibold text-white text-base truncate">{hotel.name}</p>
                                  </div>

                                  {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{hotel.area}</span>
                                    <span>•</span>
                                    <span className="shrink-0">{hotel.distanceToVenue}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="font-semibold text-sm">{hotel.rating}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({hotel.reviewCount.toLocaleString()})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {hotel.tags
                                      .filter((t) => t !== "Recommended" && t !== "Policy compliant" && t !== "Out of policy")
                                      .slice(0, 2)
                                      .map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full mt-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectHotel(hotel);
                                    }}
                                  >
                                    Select
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Sentinel + load more */}
                        <div ref={sentinelRef} className="py-8 flex justify-center">
                          {hasMore && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading more hotels…
                            </div>
                          )}
                        </div>
                      </>
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
