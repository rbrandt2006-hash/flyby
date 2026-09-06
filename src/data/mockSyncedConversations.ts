import { SyncedConversation } from "@/components/chats/SyncedConversationsSidebar";

// No fabricated conversations — real synced messages only.
export const mockSyncedConversations: SyncedConversation[] = [];

export const mockDetectedTrips: Record<string, {
  destination: string;
  dates: string;
  purpose: string;
  flight: {
    airline: string;
    departure: string;
    arrival: string;
    price: number;
  };
  hotel: {
    name: string;
    location: string;
    pricePerNight: number;
    nights: number;
  };
  totalCost: number;
  confidence: number;
  reasoning: string;
}> = {};
