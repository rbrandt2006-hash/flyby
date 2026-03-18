import { useState, useEffect, useCallback } from "react";

export interface TripTimelineEvent {
  id: string;
  type: "created" | "ai_recommendation" | "user_edit" | "message_sent" | "plan_refined" | "confirmed" | "cancelled";
  description: string;
  timestamp: string;
}

export interface TripDecision {
  id: string;
  question: string;
  decision: string;
  madeBy: "user" | "ai";
  timestamp: string;
}

export interface TripAIReasoning {
  costEfficiency: { score: number; label: string; detail: string };
  timeEfficiency: { score: number; label: string; detail: string };
  policyCompliance: { score: number; label: string; detail: string };
  riskLevel: { score: number; label: string; detail: string };
  summary: string;
}

export type ApprovalStatus = "none" | "pending" | "approved" | "rejected";

export interface LocalTripFlight {
  airline: string;
  departTime: string;
  returnTime: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  arrivalTime?: string;
  duration?: string;
  stops?: number;
  cabinClass?: string;
  price?: number;
  emissions?: string;
}

export interface LocalTrip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: "draft" | "pending" | "confirmed" | "cancelled" | "archived";
  approvalStatus: ApprovalStatus;
  calendarEventId: string | null;
  calendarSyncError: string | null;
  participants: string[];
  chatId: string | null;
  flight: LocalTripFlight | null;
  hotel: {
    name: string;
    location: string;
  } | null;
  groundTransport: string | null;
  estimatedCost: number;
  confidenceLevel: number;
  aiReasoning: TripAIReasoning;
  timeline: TripTimelineEvent[];
  decisions: TripDecision[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  confirmedAt?: string;
  approvedAt?: string;
}

const STORAGE_KEY = "flyby_local_trips";

function loadTripsFromStorage(): LocalTrip[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load trips from localStorage:", e);
  }
  return [];
}

function saveTripsToStorage(trips: LocalTrip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error("Failed to save trips to localStorage:", e);
  }
}

function generateAIReasoning(destination: string, cost: number): TripAIReasoning {
  const savings = Math.floor(Math.random() * 300) + 100;
  return {
    costEfficiency: {
      score: 85 + Math.floor(Math.random() * 15),
      label: "High",
      detail: `This option saves ~$${savings} compared to alternatives`,
    },
    timeEfficiency: {
      score: 88 + Math.floor(Math.random() * 12),
      label: "Excellent",
      detail: "Arrives before 9 AM, optimal for morning meetings",
    },
    policyCompliance: {
      score: 100,
      label: "Compliant",
      detail: "Within daily budget threshold and preferred vendors",
    },
    riskLevel: {
      score: 10 + Math.floor(Math.random() * 20),
      label: "Low",
      detail: "Weather risk is minimal, no travel advisories",
    },
    summary: `This plan was optimized for cost and convenience. The selected flight arrives early enough for a full business day, and the hotel is within walking distance of ${destination} business district. Total cost is 12% below typical bookings for this route.`,
  };
}

export function useTrips() {
  const [trips, setTrips] = useState<LocalTrip[]>(() => loadTripsFromStorage());

  useEffect(() => {
    saveTripsToStorage(trips);
  }, [trips]);

  const createTrip = useCallback((tripData: {
    destination: string;
    startDate: string;
    endDate: string;
    purpose: string;
    flight: { airline: string; departTime: string; returnTime: string } | null;
    hotel: { name: string; location: string } | null;
    groundTransport: string | null;
    estimatedCost: number;
    confidenceLevel?: number;
  }): LocalTrip => {
    const now = new Date().toISOString();
    const aiReasoning = generateAIReasoning(tripData.destination, tripData.estimatedCost);
    
    const newTrip: LocalTrip = {
      id: `trip_${Date.now()}`,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      purpose: tripData.purpose,
      status: "draft",
      approvalStatus: "none",
      calendarEventId: null,
      calendarSyncError: null,
      participants: [],
      chatId: null,
      flight: tripData.flight,
      hotel: tripData.hotel,
      groundTransport: tripData.groundTransport,
      estimatedCost: tripData.estimatedCost,
      confidenceLevel: tripData.confidenceLevel || 87,
      aiReasoning,
      timeline: [
        {
          id: `evt_${Date.now()}_1`,
          type: "created",
          description: "Trip created",
          timestamp: now,
        },
        {
          id: `evt_${Date.now()}_2`,
          type: "ai_recommendation",
          description: "AI generated travel recommendations",
          timestamp: now,
        },
      ],
      decisions: [
        {
          id: `dec_${Date.now()}_1`,
          question: "Flight selection",
          decision: tripData.flight?.airline || "No flight selected",
          madeBy: "ai",
          timestamp: now,
        },
        {
          id: `dec_${Date.now()}_2`,
          question: "Hotel selection",
          decision: tripData.hotel?.name || "No hotel selected",
          madeBy: "ai",
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setTrips((prev) => [...prev, newTrip]);
    return newTrip;
  }, []);

  const updateTrip = useCallback((tripId: string, updates: Partial<LocalTrip>) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      )
    );
  }, []);

  const addTimelineEvent = useCallback((tripId: string, event: Omit<TripTimelineEvent, "id" | "timestamp">) => {
    const newEvent: TripTimelineEvent = {
      id: `evt_${Date.now()}`,
      ...event,
      timestamp: new Date().toISOString(),
    };

    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, timeline: [...trip.timeline, newEvent], updatedAt: new Date().toISOString() }
          : trip
      )
    );
  }, []);

  const linkChatToTrip = useCallback((tripId: string, chatId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, chatId, updatedAt: new Date().toISOString() }
          : trip
      )
    );
  }, []);

  const getTripById = useCallback((tripId: string) => {
    return trips.find((t) => t.id === tripId) || null;
  }, [trips]);

  const getTripByChatId = useCallback((chatId: string) => {
    return trips.find((t) => t.chatId === chatId) || null;
  }, [trips]);

  const confirmTrip = useCallback((tripId: string) => {
    const now = new Date().toISOString();
    updateTrip(tripId, { 
      status: "confirmed",
      approvalStatus: "pending",
      confirmedAt: now,
    });
    addTimelineEvent(tripId, {
      type: "confirmed",
      description: "Trip confirmed by user — awaiting manager approval",
    });
  }, [updateTrip, addTimelineEvent]);

  const revertToDraft = useCallback((tripId: string) => {
    updateTrip(tripId, { 
      status: "draft",
      approvalStatus: "none",
      confirmedAt: undefined,
    });
    addTimelineEvent(tripId, {
      type: "user_edit",
      description: "Confirmation undone — trip reverted to draft",
    });
  }, [updateTrip, addTimelineEvent]);

  const approveTrip = useCallback((tripId: string) => {
    const now = new Date().toISOString();
    updateTrip(tripId, { 
      approvalStatus: "approved",
      approvedAt: now,
    });
    addTimelineEvent(tripId, {
      type: "confirmed",
      description: "Trip approved by manager",
    });
  }, [updateTrip, addTimelineEvent]);

  const rejectTrip = useCallback((tripId: string, reason?: string) => {
    updateTrip(tripId, { 
      approvalStatus: "rejected",
    });
    addTimelineEvent(tripId, {
      type: "cancelled",
      description: reason ? `Trip rejected: ${reason}` : "Trip rejected by manager",
    });
  }, [updateTrip, addTimelineEvent]);

  const setCalendarEventId = useCallback((tripId: string, eventId: string) => {
    updateTrip(tripId, { 
      calendarEventId: eventId,
      calendarSyncError: null,
    });
  }, [updateTrip]);

  const setCalendarSyncError = useCallback((tripId: string, error: string) => {
    updateTrip(tripId, { 
      calendarSyncError: error,
    });
  }, [updateTrip]);

  const cancelTrip = useCallback((tripId: string) => {
    updateTrip(tripId, { status: "cancelled" });
    addTimelineEvent(tripId, {
      type: "cancelled",
      description: "Trip cancelled by user",
    });
  }, [updateTrip, addTimelineEvent]);

  const archiveTrip = useCallback((tripId: string) => {
    updateTrip(tripId, { 
      status: "archived", 
      archivedAt: new Date().toISOString() 
    });
  }, [updateTrip]);

  const unarchiveTrip = useCallback((tripId: string) => {
    updateTrip(tripId, { 
      status: "cancelled",
      archivedAt: undefined
    });
  }, [updateTrip]);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  }, []);

  const rebookTrip = useCallback((tripId: string, newFlight: {
    airline: string;
    flightNumber?: string;
    departTime: string;
    arrivalTime?: string;
    price: number;
  }) => {
    const now = new Date().toISOString();
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              status: trip.status === "cancelled" ? "pending" : trip.status,
              flight: {
                airline: newFlight.airline,
                departTime: newFlight.departTime,
                returnTime: newFlight.arrivalTime || trip.flight?.returnTime || "",
              },
              estimatedCost: newFlight.price + (trip.estimatedCost - (trip.flight ? 350 : 0)), // Adjust cost
              timeline: [
                ...trip.timeline,
                {
                  id: `evt_${Date.now()}`,
                  type: "plan_refined" as const,
                  description: `Flight rebooked to ${newFlight.airline}${newFlight.flightNumber ? ` (${newFlight.flightNumber})` : ""}`,
                  timestamp: now,
                },
              ],
              updatedAt: now,
            }
          : trip
      )
    );
  }, []);

  // Create a trip from a rebook action (when no existing trip)
  const createTripFromRebook = useCallback((destination: string, flightData: {
    airline: string;
    flightNumber?: string;
    departTime: string;
    arrivalTime?: string;
    price: number;
  }): LocalTrip => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const aiReasoning = generateAIReasoning(destination, flightData.price);
    
    const newTrip: LocalTrip = {
      id: `trip_${Date.now()}`,
      destination,
      startDate,
      endDate,
      purpose: "Rebooked trip",
      status: "pending",
      approvalStatus: "none",
      calendarEventId: null,
      calendarSyncError: null,
      participants: [],
      chatId: null,
      flight: {
        airline: flightData.airline,
        departTime: flightData.departTime,
        returnTime: flightData.arrivalTime || "",
      },
      hotel: null,
      groundTransport: null,
      estimatedCost: flightData.price + 800, // Base cost estimate
      confidenceLevel: 85,
      aiReasoning,
      timeline: [
        {
          id: `evt_${Date.now()}_1`,
          type: "created",
          description: "Trip created from rebook",
          timestamp: now.toISOString(),
        },
      ],
      decisions: [
        {
          id: `dec_${Date.now()}_1`,
          question: "Flight selection",
          decision: flightData.airline,
          madeBy: "user",
          timestamp: now.toISOString(),
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setTrips((prev) => [...prev, newTrip]);
    return newTrip;
  }, []);

  // Find trip by destination (for rebook matching)
  const getTripByDestination = useCallback((destination: string) => {
    return trips.find((t) => 
      t.destination.toLowerCase().includes(destination.toLowerCase()) ||
      destination.toLowerCase().includes(t.destination.toLowerCase())
    ) || null;
  }, [trips]);

  return {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    addTimelineEvent,
    linkChatToTrip,
    getTripById,
    getTripByChatId,
    getTripByDestination,
    confirmTrip,
    revertToDraft,
    approveTrip,
    rejectTrip,
    setCalendarEventId,
    setCalendarSyncError,
    cancelTrip,
    archiveTrip,
    unarchiveTrip,
    rebookTrip,
    createTripFromRebook,
  };
}
