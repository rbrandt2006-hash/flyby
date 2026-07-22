import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { readCache, useBackendDocument } from "./useBackendCollection";
import { 
  TripItinerary, 
  ItineraryBlock, 
  ItineraryDay, 
  ItineraryWarning,
  generateBlockId,
  doTimesOverlap,
  FlightBlock,
  HotelCheckinBlock,
  HotelCheckoutBlock,
  MeetingBlock,
} from "@/types/itinerary";
import { addDays, format } from "date-fns";

const STORAGE_KEY = "flyby_itineraries";

interface UseItineraryOptions {
  tripId: string;
  startDate: Date;
  endDate: Date;
  tripData?: {
    destination?: string;
    flight?: {
      airline?: string;
      flightNumber?: string;
      departTime?: string;
      returnTime?: string;
    };
    hotel?: {
      name?: string;
      location?: string;
    };
  };
}

/**
 * Turn stored day dates back into `Date` objects.
 *
 * Itineraries travel as JSON, so every `date` arrives as a string and has to be
 * revived before the editor can work with it.
 */
function rehydrateDates(itinerary: TripItinerary): TripItinerary {
  return {
    ...itinerary,
    days: (itinerary.days ?? []).map((day) => ({
      ...day,
      date: new Date(day.date),
    })),
  };
}

// Generate initial itinerary based on trip data
function generateInitialItinerary(options: UseItineraryOptions): TripItinerary {
  const { tripId, startDate, endDate, tripData } = options;
  const days: ItineraryDay[] = [];
  
  let currentDate = new Date(startDate);
  let dayIndex = 0;
  
  while (currentDate <= endDate) {
    const blocks: ItineraryBlock[] = [];
    
    // First day - add arrival flight and hotel check-in
    if (dayIndex === 0) {
      if (tripData?.flight?.airline) {
        const flightBlock: FlightBlock = {
          id: generateBlockId(),
          type: "flight",
          dayIndex,
          startTime: "07:00",
          endTime: "10:00",
          order: 0,
          airline: tripData.flight.airline,
          flightNumber: tripData.flight.flightNumber || "",
          departureAirport: "Home Airport",
          arrivalAirport: tripData?.destination?.split(",")[0] || "Destination",
          departureTime: tripData.flight.departTime || "7:00 AM",
          arrivalTime: "10:00 AM",
          isReturn: false,
        };
        blocks.push(flightBlock);
      }
      
      if (tripData?.hotel?.name) {
        const checkinBlock: HotelCheckinBlock = {
          id: generateBlockId(),
          type: "hotel_checkin",
          dayIndex,
          startTime: "15:00",
          endTime: "15:30",
          order: 1,
          hotelName: tripData.hotel.name,
          address: tripData.hotel.location || "",
        };
        blocks.push(checkinBlock);
      }
    }
    
    // Last day - add hotel checkout and return flight
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex === totalDays) {
      if (tripData?.hotel?.name) {
        const checkoutBlock: HotelCheckoutBlock = {
          id: generateBlockId(),
          type: "hotel_checkout",
          dayIndex,
          startTime: "11:00",
          endTime: "11:30",
          order: 0,
          hotelName: tripData.hotel.name,
          address: tripData.hotel.location || "",
        };
        blocks.push(checkoutBlock);
      }
      
      if (tripData?.flight?.airline) {
        const returnFlightBlock: FlightBlock = {
          id: generateBlockId(),
          type: "flight",
          dayIndex,
          startTime: "14:00",
          endTime: "17:00",
          order: 1,
          airline: tripData.flight.airline,
          flightNumber: tripData.flight.flightNumber || "",
          departureAirport: tripData?.destination?.split(",")[0] || "Destination",
          arrivalAirport: "Home Airport",
          departureTime: tripData.flight.returnTime || "2:00 PM",
          arrivalTime: "5:00 PM",
          isReturn: true,
        };
        blocks.push(returnFlightBlock);
      }
    }
    
    // Middle days - add placeholder meeting
    if (dayIndex > 0 && dayIndex < totalDays) {
      const meetingBlock: MeetingBlock = {
        id: generateBlockId(),
        type: "meeting",
        dayIndex,
        startTime: "09:00",
        endTime: "12:00",
        order: 0,
        title: "Business Meeting",
        location: tripData?.destination || "TBD",
        attendees: [],
        businessPurpose: "Client meeting",
      };
      blocks.push(meetingBlock);
    }
    
    days.push({
      dayIndex,
      date: new Date(currentDate),
      title: dayIndex === 0 
        ? "Arrival Day" 
        : dayIndex === totalDays 
        ? "Departure Day" 
        : `Day ${dayIndex + 1}`,
      blocks: blocks.sort((a, b) => a.order - b.order),
    });
    
    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }
  
  return {
    tripId,
    days,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lastModified: new Date().toISOString(),
  };
}

export function useItinerary(options: UseItineraryOptions) {
  const { tripId, startDate, endDate, tripData } = options;
  
  // Every itinerary the user owns, kept in sync with the backend and keyed by
  // trip. This hook edits one of them.
  const [itineraries, setItineraries] = useBackendDocument<Record<string, TripItinerary>>({
    endpoint: "itineraries",
    payloadKey: "itineraries",
    cacheKey: STORAGE_KEY,
    initial: {},
  });

  const [itinerary, setItinerary] = useState<TripItinerary>(() => {
    // Start from the cached copy so the editor renders immediately; the server
    // copy replaces it below once it arrives.
    const cached = readCache<Record<string, TripItinerary>>(STORAGE_KEY, {});
    return cached[tripId] ? rehydrateDates(cached[tripId]) : generateInitialItinerary(options);
  });

  // Adopt the server's copy once, so it doesn't overwrite edits made while the
  // request was still in flight.
  const adoptedFromServer = useRef(false);
  useEffect(() => {
    if (adoptedFromServer.current) return;
    const stored = itineraries[tripId];
    if (stored) {
      setItinerary(rehydrateDates(stored));
      adoptedFromServer.current = true;
    }
  }, [itineraries, tripId]);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Calculate warnings
  const warnings = useMemo<ItineraryWarning[]>(() => {
    const result: ItineraryWarning[] = [];
    
    itinerary.days.forEach((day) => {
      const blocks = day.blocks;
      
      // Check for overlapping times
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          if (doTimesOverlap(
            blocks[i].startTime,
            blocks[i].endTime,
            blocks[j].startTime,
            blocks[j].endTime
          )) {
            result.push({
              id: `overlap_${blocks[i].id}_${blocks[j].id}`,
              type: "overlap",
              severity: "warning",
              message: `Time conflict: Two activities overlap on ${format(day.date, "MMM d")}`,
              blockIds: [blocks[i].id, blocks[j].id],
              dayIndex: day.dayIndex,
            });
          }
        }
      }
      
      // Check for meetings during checkout/flight times
      const flightBlocks = blocks.filter(b => b.type === "flight");
      const checkoutBlocks = blocks.filter(b => b.type === "hotel_checkout");
      const meetingBlocks = blocks.filter(b => b.type === "meeting");
      
      meetingBlocks.forEach(meeting => {
        [...flightBlocks, ...checkoutBlocks].forEach(critical => {
          if (doTimesOverlap(meeting.startTime, meeting.endTime, critical.startTime, critical.endTime)) {
            result.push({
              id: `conflict_${meeting.id}_${critical.id}`,
              type: "conflict",
              severity: "error",
              message: `Meeting overlaps with ${critical.type === "flight" ? "flight" : "checkout"} time`,
              blockIds: [meeting.id, critical.id],
              dayIndex: day.dayIndex,
            });
          }
        });
      });
    });
    
    return result;
  }, [itinerary]);
  
  // Write this trip's itinerary back into the synced map.
  useEffect(() => {
    setItineraries((prev) => ({ ...prev, [tripId]: itinerary }));
  }, [itinerary, tripId, setItineraries]);
  
  // Add a block to a specific day
  const addBlock = useCallback((dayIndex: number, block: Omit<ItineraryBlock, "id" | "order" | "dayIndex">) => {
    setItinerary(prev => {
      const newDays = [...prev.days];
      const day = newDays[dayIndex];
      if (!day) return prev;
      
      const newBlock = {
        ...block,
        id: generateBlockId(),
        dayIndex,
        order: day.blocks.length,
      } as ItineraryBlock;
      
      newDays[dayIndex] = {
        ...day,
        blocks: [...day.blocks, newBlock].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        }),
      };
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Update a block
  const updateBlock = useCallback((blockId: string, updates: Record<string, unknown>) => {
    setItinerary(prev => {
      const newDays: ItineraryDay[] = prev.days.map(day => ({
        ...day,
        blocks: day.blocks.map(block => 
          block.id === blockId ? { ...block, ...updates } as ItineraryBlock : block
        ).sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        }),
      }));
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setItinerary(prev => {
      const newDays = prev.days.map(day => ({
        ...day,
        blocks: day.blocks.filter(block => block.id !== blockId),
      }));
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Duplicate a block
  const duplicateBlock = useCallback((blockId: string) => {
    setItinerary(prev => {
      let targetBlock: ItineraryBlock | null = null;
      let targetDayIndex = -1;
      
      prev.days.forEach((day, idx) => {
        const found = day.blocks.find(b => b.id === blockId);
        if (found) {
          targetBlock = found;
          targetDayIndex = idx;
        }
      });
      
      if (!targetBlock || targetDayIndex === -1) return prev;
      
      const newBlock = {
        ...targetBlock,
        id: generateBlockId(),
        order: prev.days[targetDayIndex].blocks.length,
        startTime: incrementTime(targetBlock.endTime, 30),
        endTime: incrementTime(targetBlock.endTime, 90),
      };
      
      const newDays = [...prev.days];
      newDays[targetDayIndex] = {
        ...newDays[targetDayIndex],
        blocks: [...newDays[targetDayIndex].blocks, newBlock as ItineraryBlock].sort((a, b) => {
          const timeA = a.startTime.split(":").map(Number);
          const timeB = b.startTime.split(":").map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        }),
      };
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Reorder blocks within a day (for drag-and-drop)
  const reorderBlocks = useCallback((dayIndex: number, sourceIndex: number, destinationIndex: number) => {
    setItinerary(prev => {
      const newDays = [...prev.days];
      const day = newDays[dayIndex];
      if (!day) return prev;
      
      const blocks = [...day.blocks];
      const [removed] = blocks.splice(sourceIndex, 1);
      blocks.splice(destinationIndex, 0, removed);
      
      // Update order values
      const reorderedBlocks = blocks.map((block, idx) => ({
        ...block,
        order: idx,
      }));
      
      newDays[dayIndex] = {
        ...day,
        blocks: reorderedBlocks,
      };
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Update day title
  const updateDayTitle = useCallback((dayIndex: number, title: string) => {
    setItinerary(prev => {
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          title,
        };
      }
      
      setHasUnsavedChanges(true);
      return {
        ...prev,
        days: newDays,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);
  
  // Reset to initial state
  const resetItinerary = useCallback(() => {
    setItinerary(generateInitialItinerary(options));
    setHasUnsavedChanges(false);
  }, [options]);
  
  // Mark as saved
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);
  
  return {
    itinerary,
    warnings,
    hasUnsavedChanges,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    updateDayTitle,
    resetItinerary,
    markAsSaved,
  };
}

// Helper to increment time by minutes
function incrementTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
