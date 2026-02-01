import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchFlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  price: number;
  priceDiff?: number;
  tags: string[];
  origin: string;
  destination: string;
  flightNumber?: string;
}

export interface SearchHotelResult {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  distanceToVenue: string;
  tags: string[];
  images: string[];
  amenities: string[];
  reviewCount: number;
  description: string;
  cancellationPolicy: string;
  roomTypes: string[];
  city?: string;
}

export interface SearchGroundResult {
  id: string;
  type: string;
  provider: string;
  price: number;
  description: string;
  tags: string[];
}

export interface SearchResults {
  flights: SearchFlightResult[];
  hotels: SearchHotelResult[];
  ground: SearchGroundResult[];
}

export interface SearchParams {
  query: string;
  type: "all" | "flights" | "hotels" | "ground";
  city?: string;
  origin?: string;
  dest?: string;
  checkIn?: string;
  checkOut?: string;
  date?: string;
}

export function useTravelSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults>({
    flights: [],
    hotels: [],
    ground: [],
  });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is empty (unless searching all)
    if (!params.query.trim() && params.type !== "all") {
      setResults({ flights: [], hotels: [], ground: [] });
      setError(null);
      return;
    }

    // Debounce 300ms
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const queryParams = new URLSearchParams({
          type: params.type,
          q: params.query,
          ...(params.city && { city: params.city }),
          ...(params.origin && { origin: params.origin }),
          ...(params.dest && { dest: params.dest }),
          ...(params.checkIn && { checkIn: params.checkIn }),
          ...(params.checkOut && { checkOut: params.checkOut }),
          ...(params.date && { date: params.date }),
        });

        const { data, error: fnError } = await supabase.functions.invoke("search-travel", {
          body: null,
          headers: {},
        });

        // Since supabase.functions.invoke doesn't support query params well,
        // we'll make a direct fetch call instead
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-travel?${queryParams.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const searchResults = await response.json();

        setResults({
          flights: searchResults.flights || [],
          hotels: searchResults.hotels || [],
          ground: searchResults.ground || [],
        });

      } catch (err: any) {
        if (err.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Search error:", err);
        setError(err.message || "Search failed");
        setResults({ flights: [], hotels: [], ground: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults({ flights: [], hotels: [], ground: [] });
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    search,
    clearResults,
    results,
    isSearching,
    error,
  };
}
