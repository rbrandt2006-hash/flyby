import { SyncedConversation } from "@/components/chats/SyncedConversationsSidebar";

export const mockSyncedConversations: SyncedConversation[] = [
  {
    id: "conv-1",
    name: "Acme Corp Deal",
    source: "slack",
    channel: "sales-acme",
    hasTravelIntent: true,
    lastUpdated: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        senderId: "sarah",
        senderName: "Sarah Chen",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        text: "Just got off a call with Acme's VP. They want to meet in person to close the deal.",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "m2",
        senderId: "mike",
        senderName: "Mike Rodriguez",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        text: "That's great news! When are they thinking?",
        createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      },
      {
        id: "m3",
        senderId: "sarah",
        senderName: "Sarah Chen",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        text: "They mentioned next week, ideally Tuesday or Wednesday. Their office is in NYC, near Grand Central.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "m4",
        senderId: "mike",
        senderName: "Mike Rodriguez",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        text: "Perfect. I can fly out Monday evening and be there for the client meeting Tuesday morning.",
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: "m5",
        senderId: "sarah",
        senderName: "Sarah Chen",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        text: "Sounds good. Let's book a hotel near their headquarters. The presentation is at 10am.",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  {
    id: "conv-2",
    name: "Q1 Planning",
    source: "teams",
    channel: "leadership",
    hasTravelIntent: true,
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: "m6",
        senderId: "jennifer",
        senderName: "Jennifer Walsh",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        text: "Team, the annual conference is confirmed for San Francisco in February.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "m7",
        senderId: "david",
        senderName: "David Kim",
        senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        text: "Great! I'll need to travel from Chicago. What are the dates?",
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
      {
        id: "m8",
        senderId: "jennifer",
        senderName: "Jennifer Walsh",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        text: "February 15-17. The summit is at the Moscone Center. We should book hotels soon.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: "conv-3",
    name: "Product Updates",
    source: "slack",
    channel: "product-team",
    hasTravelIntent: false,
    lastUpdated: new Date(Date.now() - 3600000 * 5).toISOString(),
    messages: [
      {
        id: "m9",
        senderId: "alex",
        senderName: "Alex Turner",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        text: "The new dashboard is ready for review. Can everyone take a look?",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "m10",
        senderId: "emma",
        senderName: "Emma Watson",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        text: "Looks great! I love the new charts. Just a few minor tweaks on mobile.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  },
  {
    id: "conv-4",
    name: "Austin Workshop",
    source: "teams",
    channel: "engineering",
    hasTravelIntent: true,
    lastUpdated: new Date(Date.now() - 3600000 * 8).toISOString(),
    messages: [
      {
        id: "m11",
        senderId: "tom",
        senderName: "Tom Bradley",
        senderAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
        text: "The Austin team wants to host a workshop next month. Who's interested?",
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        id: "m12",
        senderId: "lisa",
        senderName: "Lisa Park",
        senderAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        text: "Count me in! I've been wanting to visit their office. When are you thinking?",
        createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
      {
        id: "m13",
        senderId: "tom",
        senderName: "Tom Bradley",
        senderAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
        text: "Looking at the week of March 10th. The demo is scheduled for Wednesday.",
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
  },
];

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
}> = {
  "conv-1": {
    destination: "New York City",
    dates: "Jan 6-8, 2025",
    purpose: "Client meeting with Acme Corp",
    flight: {
      airline: "Delta",
      departure: "SFO 6:00 PM",
      arrival: "JFK 2:30 AM",
      price: 380,
    },
    hotel: {
      name: "The Roosevelt Hotel",
      location: "Near Grand Central Station",
      pricePerNight: 289,
      nights: 2,
    },
    totalCost: 958,
    confidence: 94,
    reasoning: "Detected client meeting in NYC next week. Selected hotel near Grand Central based on mentioned location. Flight arrives evening before to ensure readiness for 10am meeting.",
  },
  "conv-2": {
    destination: "San Francisco",
    dates: "Feb 14-18, 2025",
    purpose: "Annual Conference at Moscone Center",
    flight: {
      airline: "United",
      departure: "ORD 8:00 AM",
      arrival: "SFO 10:30 AM",
      price: 420,
    },
    hotel: {
      name: "Marriott Marquis",
      location: "Adjacent to Moscone Center",
      pricePerNight: 349,
      nights: 4,
    },
    totalCost: 1816,
    confidence: 89,
    reasoning: "Conference dates confirmed (Feb 15-17). Hotel selected for proximity to Moscone Center. Early arrival recommended for setup and networking.",
  },
  "conv-4": {
    destination: "Austin",
    dates: "Mar 10-13, 2025",
    purpose: "Engineering Workshop",
    flight: {
      airline: "Southwest",
      departure: "SFO 7:30 AM",
      arrival: "AUS 1:00 PM",
      price: 290,
    },
    hotel: {
      name: "Kimpton Hotel Van Zandt",
      location: "Downtown Austin",
      pricePerNight: 259,
      nights: 3,
    },
    totalCost: 1067,
    confidence: 86,
    reasoning: "Workshop week identified (March 10th). Demo on Wednesday means arrival Monday recommended. Hotel in downtown for easy access to Austin office.",
  },
};
