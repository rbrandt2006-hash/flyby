import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Car,
  Clock,
  Users,
  Check,
  Sparkles,
  Leaf,
  Link2,
  Star,
  ArrowUpDown,
  RefreshCw,
  Train,
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  type GroundTransportOption,
  type UberAccount,
  mockUberAccount,
  generateUberOptions,
  generateRentalOptions,
  generatePublicTransitOptions,
} from "@/services/mockGroundTransportService";
import { TransportIcon, SectionHeaderIcon } from "@/components/trips/TransportIcon";

interface GroundTransportSelectionPageProps {
  open: boolean;
  onClose: () => void;
  options: GroundTransportOption[];
  selectedOption: GroundTransportOption | null;
  onSelect: (option: GroundTransportOption) => void;
  tripContext?: {
    originCity?: string;
    destinationCity?: string;
    startDate?: string;
    endDate?: string;
  };
}

type FilterCategory = "all" | "rideshare" | "rental" | "public";
type SortOption = "recommended" | "cheapest" | "fastest";

// Cache for loaded options per category
const optionsCache: Record<string, { data: GroundTransportOption[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function GroundTransportSelectionPage({
  open,
  onClose,
  options,
  selectedOption,
  onSelect,
  tripContext,
}: GroundTransportSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [uberAccount] = useState<UberAccount>(mockUberAccount);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  
  // Loading states per category
  const [loadingCategories, setLoadingCategories] = useState<Record<FilterCategory, boolean>>({
    all: false,
    rideshare: false,
    rental: false,
    public: false,
  });
  
  // Error states per category
  const [errorCategories, setErrorCategories] = useState<Record<FilterCategory, string | null>>({
    all: null,
    rideshare: null,
    rental: null,
    public: null,
  });
  
  // Loaded options per category
  const [categoryOptions, setCategoryOptions] = useState<Record<FilterCategory, GroundTransportOption[]>>({
    all: [],
    rideshare: [],
    rental: [],
    public: [],
  });

  // Generate cache key
  const getCacheKey = useCallback((category: FilterCategory) => {
    const context = tripContext || {};
    return `${category}_${context.originCity || 'default'}_${context.destinationCity || 'default'}_${context.startDate || ''}`;
  }, [tripContext]);

  // Load options for a specific category
  const loadCategoryOptions = useCallback(async (category: FilterCategory, forceRefresh = false) => {
    const cacheKey = getCacheKey(category);
    
    // Check cache first
    if (!forceRefresh && optionsCache[cacheKey]) {
      const cached = optionsCache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        setCategoryOptions(prev => ({ ...prev, [category]: cached.data }));
        return;
      }
    }
    
    setLoadingCategories(prev => ({ ...prev, [category]: true }));
    setErrorCategories(prev => ({ ...prev, [category]: null }));
    
    try {
      // Simulate API call with delay
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      
      let data: GroundTransportOption[] = [];
      
      switch (category) {
        case "rideshare":
          data = generateUberOptions();
          break;
        case "rental":
          data = generateRentalOptions();
          break;
        case "public":
          data = generatePublicTransitOptions();
          break;
        case "all":
          data = [
            ...generateUberOptions(),
            ...generateRentalOptions(),
            ...generatePublicTransitOptions(),
          ];
          break;
      }
      
      // Cache the result
      optionsCache[cacheKey] = { data, timestamp: Date.now() };
      setCategoryOptions(prev => ({ ...prev, [category]: data }));
      
    } catch (error) {
      console.error(`Failed to load ${category} options:`, error);
      setErrorCategories(prev => ({ 
        ...prev, 
        [category]: `Couldn't load ${category === 'all' ? 'options' : category} options. Please try again.` 
      }));
    } finally {
      setLoadingCategories(prev => ({ ...prev, [category]: false }));
    }
  }, [getCacheKey]);

  // Load initial options or use passed options
  useEffect(() => {
    if (open) {
      if (options.length > 0) {
        // Use passed options
        setCategoryOptions({
          all: options,
          rideshare: options.filter(o => o.type === "rideshare"),
          rental: options.filter(o => o.type === "rental"),
          public: options.filter(o => o.type === "public"),
        });
      } else {
        // Load all options initially
        loadCategoryOptions("all");
      }
    }
  }, [open, options, loadCategoryOptions]);

  // Load category-specific options when tab changes
  useEffect(() => {
    if (open && filterCategory !== "all") {
      const currentOptions = categoryOptions[filterCategory];
      if (currentOptions.length === 0 && !loadingCategories[filterCategory]) {
        loadCategoryOptions(filterCategory);
      }
    }
  }, [open, filterCategory, categoryOptions, loadingCategories, loadCategoryOptions]);

  // Get current options for active category
  const currentCategoryOptions = useMemo(() => {
    return categoryOptions[filterCategory] || [];
  }, [categoryOptions, filterCategory]);

  // Sort options
  const sortedOptions = useMemo(() => {
    const opts = [...currentCategoryOptions];
    
    switch (sortOption) {
      case "cheapest":
        return opts.sort((a, b) => a.price - b.price);
      case "fastest":
        return opts.sort((a, b) => {
          // Parse ETA strings like "3 min", "Every 10 min"
          const getMinutes = (eta: string) => {
            const match = eta.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 999;
          };
          return getMinutes(a.eta) - getMinutes(b.eta);
        });
      case "recommended":
      default:
        // Best value first, then by price
        return opts.sort((a, b) => {
          const aHasBestValue = a.tags.includes("Best value") ? 0 : 1;
          const bHasBestValue = b.tags.includes("Best value") ? 0 : 1;
          if (aHasBestValue !== bHasBestValue) return aHasBestValue - bHasBestValue;
          return a.price - b.price;
        });
    }
  }, [currentCategoryOptions, sortOption]);

  // Filter by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return sortedOptions;
    
    const query = searchQuery.toLowerCase();
    return sortedOptions.filter(
      (o) =>
        o.rideType.toLowerCase().includes(query) ||
        o.provider.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query)
    );
  }, [sortedOptions, searchQuery]);

  const handleSelectOption = (option: GroundTransportOption) => {
    onSelect(option);
    setSearchQuery("");
    setFilterCategory("all");
    onClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setFilterCategory("all");
    onClose();
  };

  const handleRefresh = () => {
    loadCategoryOptions(filterCategory, true);
  };

  const categoryLabels: Record<FilterCategory, string> = {
    all: "All options",
    rideshare: "Rideshare",
    rental: "Rental cars",
    public: "Public transit",
  };

  const sortLabels: Record<SortOption, string> = {
    recommended: "Recommended",
    cheapest: "Cheapest",
    fastest: "Fastest",
  };

  const isLoading = loadingCategories[filterCategory];
  const error = errorCategories[filterCategory];

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
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 shrink-0 bg-background border-b border-border">
            <div className="px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Back button and title */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={handleClose}
                    className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Back to trip
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                          Choose ground transport
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {tripContext?.originCity && tripContext?.destinationCity 
                            ? `${tripContext.originCity} → ${tripContext.destinationCity}` 
                            : "Airport to hotel"} • {categoryOptions.all.length || filteredOptions.length} options
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Uber Account Section */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border/60 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
                        <Car className="w-5 h-5 text-background" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Uber</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            <Link2 className="w-2.5 h-2.5 mr-1" />
                            Connected
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {uberAccount.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{uberAccount.rating}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {uberAccount.ridesCompleted} rides
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setShowDisconnectConfirm(true)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  {/* Disconnect confirmation */}
                  <AnimatePresence>
                    {showDisconnectConfirm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            This is a demo account. Disconnecting is not
                            available.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setShowDisconnectConfirm(false)}
                          >
                            Got it
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ride type or provider"
                    className="pl-12 h-12 text-base rounded-xl"
                  />
                </div>

                {/* Category filters and sorting */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(categoryLabels) as FilterCategory[]).map(
                      (category) => (
                        <button
                          key={category}
                          onClick={() => setFilterCategory(category)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            filterCategory === category
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {categoryLabels[category]}
                        </button>
                      )
                    )}
                  </div>
                  
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isLoading && "animate-spin")} />
                      Refresh
                    </Button>
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                      >
                        {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                          <option key={sort} value={sort}>
                            {sortLabels[sort]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/60 bg-card">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                          <div className="flex gap-4">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!isLoading && error && (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive/50" />
                  <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try again
                  </Button>
                </div>
              )}

              {/* Empty State per Category */}
              {!isLoading && !error && filteredOptions.length === 0 && (
                <EmptyState 
                  category={filterCategory} 
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                  onClearFilters={() => {
                    setSearchQuery("");
                    setFilterCategory("all");
                  }}
                  onRefresh={handleRefresh}
                />
              )}

              {/* Results */}
              {!isLoading && !error && filteredOptions.length > 0 && (
                <div className="space-y-3">
                  {/* Group by type when showing "all" */}
                  {filterCategory === "all" ? (
                    <>
                      {/* Rideshare section */}
                      {filteredOptions.some((o) => o.type === "rideshare") && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <SectionHeaderIcon type="rideshare" /> Rideshare
                          </h3>
                          <div className="space-y-2">
                            {filteredOptions
                              .filter((o) => o.type === "rideshare")
                              .map((option) => (
                                <OptionCard
                                  key={option.id}
                                  option={option}
                                  isSelected={selectedOption?.id === option.id}
                                  onSelect={handleSelectOption}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Rental section */}
                      {filteredOptions.some((o) => o.type === "rental") && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <SectionHeaderIcon type="rental" /> Rental Cars
                          </h3>
                          <div className="space-y-2">
                            {filteredOptions
                              .filter((o) => o.type === "rental")
                              .map((option) => (
                                <OptionCard
                                  key={option.id}
                                  option={option}
                                  isSelected={selectedOption?.id === option.id}
                                  onSelect={handleSelectOption}
                                  isRental
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Public transit section */}
                      {filteredOptions.some((o) => o.type === "public") && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <SectionHeaderIcon type="public" /> Public Transit
                          </h3>
                          <div className="space-y-2">
                            {filteredOptions
                              .filter((o) => o.type === "public")
                              .map((option) => (
                                <OptionCard
                                  key={option.id}
                                  option={option}
                                  isSelected={selectedOption?.id === option.id}
                                  onSelect={handleSelectOption}
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Filtered view */
                    filteredOptions.map((option) => (
                      <OptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedOption?.id === option.id}
                        onSelect={handleSelectOption}
                        isRental={option.type === "rental"}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// Empty State Component
function EmptyState({
  category,
  searchQuery,
  onClearSearch,
  onClearFilters,
  onRefresh,
}: {
  category: FilterCategory;
  searchQuery: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}) {
  if (searchQuery.trim()) {
    return (
      <div className="text-center py-16">
        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">No matches found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search term
        </p>
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  const emptyStateContent: Record<FilterCategory, { icon: React.ReactNode; title: string; description: string; suggestion: string }> = {
    all: {
      icon: <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />,
      title: "No transport options available",
      description: "We couldn't find any ground transport options for this route.",
      suggestion: "Try refreshing or check back later.",
    },
    rideshare: {
      icon: <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />,
      title: "No rideshare options",
      description: "Rideshare services may not be available in this area.",
      suggestion: "Try rental cars or public transit instead.",
    },
    rental: {
      icon: <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />,
      title: "No rental cars available",
      description: "No rental car providers found for your pickup location.",
      suggestion: "Try adjusting your pickup location or check nearby airports.",
    },
    public: {
      icon: <Train className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />,
      title: "Limited transit data",
      description: "Public transit information may be limited in this area.",
      suggestion: "Try rideshare or rental cars as alternatives.",
    },
  };

  const content = emptyStateContent[category];

  return (
    <div className="text-center py-16">
      {content.icon}
      <h3 className="text-lg font-medium mb-2">{content.title}</h3>
      <p className="text-muted-foreground mb-2">{content.description}</p>
      <p className="text-sm text-muted-foreground mb-4">{content.suggestion}</p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        {category !== "all" && (
          <Button variant="ghost" onClick={onClearFilters}>
            View all options
          </Button>
        )}
      </div>
    </div>
  );
}

// Option Card Component
function OptionCard({
  option,
  isSelected,
  onSelect,
  isRental = false,
}: {
  option: GroundTransportOption;
  isSelected: boolean;
  onSelect: (option: GroundTransportOption) => void;
  isRental?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(option)}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all",
        isSelected
          ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
          : "bg-card border-border/60 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <TransportIcon 
          type={option.iconType} 
          size="lg" 
          showBackground 
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{option.rideType}</p>
              <span className="text-xs text-muted-foreground">
                {option.provider}
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                ${option.priceMin}
                {option.priceMin !== option.priceMax && `–$${option.priceMax}`}
              </p>
              {isRental && (
                <p className="text-xs text-muted-foreground">/day</p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {option.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {option.eta}
            </span>
            {option.seats < 100 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {option.seats} seats
              </span>
            )}
            {option.co2Savings && (
              <span className="flex items-center gap-1 text-green-600">
                <Leaf className="w-3 h-3" />
                {option.co2Savings}
              </span>
            )}
          </div>

          {/* Tags */}
          {option.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {option.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={
                    tag === "Best value" || tag === "Cheapest"
                      ? "default"
                      : tag === "Most comfortable" || tag === "Premium"
                      ? "secondary"
                      : "outline"
                  }
                  className={cn(
                    "text-xs",
                    tag === "Best value" &&
                      "bg-green-500/10 text-green-600 border-green-500/20",
                    tag === "Eco-friendly" &&
                      "bg-green-500/10 text-green-600 border-green-500/20"
                  )}
                >
                  {tag === "Best value" && <Sparkles className="w-3 h-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-primary/20 flex items-center">
          <span className="text-sm font-medium text-primary flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Currently selected
          </span>
        </div>
      )}
    </button>
  );
}
