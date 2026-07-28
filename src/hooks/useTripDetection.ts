import { useEffect, useRef, useState } from "react";
import { backend, authedFetch } from "@/integrations/backend/client";
import { generateMockFlights } from "@/services/mockFlightService";
import { getHotelsForDestination } from "@/services/mockHotelService";

/**
 * Detect a trip being planned inside a chat conversation.
 *
 * The backend reads the recent messages with Gemini and returns the destination,
 * dates, travelers and purpose when a real trip is being planned. This hook
 * turns that into the full `DetectedTrip` the assistant renders — filling flight
 * and hotel specifics from the inventory generators, which stay simulated until
 * Duffel, exactly as the rest of the app does.
 *
 * Returns null when there's no session, no conversation, or no trip in it — the
 * assistant then shows nothing rather than a scripted example.
 */

export interface DetectedTrip {
  destination: string;
  dates: string;
  purpose: string;
  flight: { airline: string; departure: string; arrival: string; price: number };
  hotel: { name: string; location: string; pricePerNight: number; nights: number };
  totalCost: number;
  confidence: number;
  reasoning: string;
}

interface ChatMessageLike {
  senderName?: string;
  senderId?: string;
  text?: string;
  content?: string;
}

interface Detection {
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number;
  purpose: string | null;
  confidence: number;
  reasoning: string;
}

const DEBOUNCE_MS = 700;

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nightsBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 2;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  const n = Math.round((b - a) / 86400000);
  return n >= 1 ? n : 2;
}

/** Build the full DetectedTrip from the AI detection + generated inventory. */
function buildDetectedTrip(d: Detection): DetectedTrip {
  const nights = nightsBetween(d.startDate, d.endDate);
  const travelers = Math.max(1, d.travelers || 1);

  const flights = generateMockFlights("Home", d.destination, "economy", travelers);
  const flight = flights[0];

  const hotels = getHotelsForDestination({ destination: d.destination, nights });
  const hotel = hotels[0];

  const startLabel = fmt(d.startDate);
  const endLabel = fmt(d.endDate);
  const dates =
    startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel || "Flexible dates";

  const flightCost = (flight?.price ?? 320) * travelers;
  const hotelCost = (hotel?.pricePerNight ?? 220) * nights;

  return {
    destination: d.destination,
    dates,
    purpose: d.purpose || "Business trip",
    flight: {
      airline: flight?.airline ?? "Alaska Airlines",
      departure: flight?.departureTime ?? "8:00 AM",
      arrival: flight?.arrivalTime ?? "11:30 AM",
      price: flight?.price ?? 320,
    },
    hotel: {
      name: hotel?.name ?? "Marriott Downtown",
      location: hotel?.area ?? d.destination,
      pricePerNight: hotel?.pricePerNight ?? 220,
      nights,
    },
    totalCost: flightCost + hotelCost,
    confidence: d.confidence,
    reasoning: d.reasoning,
  };
}

export function useTripDetection(
  conversationId: string | null,
  messages: ChatMessageLike[] | undefined,
): { detectedTrip: DetectedTrip | null; detecting: boolean } {
  const [detectedTrip, setDetectedTrip] = useState<DetectedTrip | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Cache per conversation so switching threads is instant and we don't re-ask
  // Gemini about a conversation that hasn't changed.
  const cache = useRef<Map<string, DetectedTrip | null>>(new Map());

  // A stable signature of the conversation's content, so detection re-runs when
  // new messages arrive but not on unrelated re-renders.
  const signature = `${conversationId ?? ""}::${(messages ?? [])
    .map((m) => m.text ?? m.content ?? "")
    .join("|")}`;

  useEffect(() => {
    if (!conversationId || !messages || messages.length === 0) {
      setDetectedTrip(null);
      return;
    }
    if (!backend.getCurrentSession()) {
      setDetectedTrip(null);
      return;
    }
    if (cache.current.has(signature)) {
      setDetectedTrip(cache.current.get(signature) ?? null);
      return;
    }

    let active = true;
    setDetecting(true);

    const timer = setTimeout(async () => {
      try {
        const response = await authedFetch("/functions/v1/detect-trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages.map((m) => ({
              sender: m.senderName || m.senderId || "Someone",
              text: m.text || m.content || "",
            })),
          }),
        });

        const trip = response.ok ? (await response.json())?.trip : null;
        const built = trip ? buildDetectedTrip(trip as Detection) : null;
        cache.current.set(signature, built);
        if (active) setDetectedTrip(built);
      } catch {
        if (active) setDetectedTrip(null);
      } finally {
        if (active) setDetecting(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [signature, conversationId, messages]);

  return { detectedTrip, detecting };
}
