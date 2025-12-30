import { useState, useMemo, useCallback } from "react";
import { useTrips, LocalTrip } from "./useTrips";
import { useExpenses, Expense } from "./useExpenses";
import { useChats, Chat, teamMembers, ChatUser } from "./useChats";

export interface SearchResult {
  id: string;
  type: "trip" | "expense" | "chat" | "person";
  title: string;
  subtitle: string;
  entityId: string;
}

export function useGlobalSearch() {
  const { trips } = useTrips();
  const { expenses } = useExpenses();
  const { chats } = useChats();
  const [query, setQuery] = useState("");

  const search = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search trips
    trips.forEach((trip) => {
      const matchesDestination = trip.destination.toLowerCase().includes(q);
      const matchesPurpose = trip.purpose?.toLowerCase().includes(q);
      const matchesAirline = trip.flight?.airline?.toLowerCase().includes(q);
      
      if (matchesDestination || matchesPurpose || matchesAirline) {
        results.push({
          id: `trip_${trip.id}`,
          type: "trip",
          title: trip.destination,
          subtitle: `${trip.status} • $${trip.estimatedCost.toLocaleString()}`,
          entityId: trip.id,
        });
      }
    });

    // Search expenses
    expenses.forEach((expense) => {
      const matchesMerchant = expense.merchant.toLowerCase().includes(q);
      const matchesDescription = expense.description?.toLowerCase().includes(q);
      const matchesCategory = expense.category.toLowerCase().includes(q);
      
      if (matchesMerchant || matchesDescription || matchesCategory) {
        results.push({
          id: `expense_${expense.id}`,
          type: "expense",
          title: expense.merchant,
          subtitle: `$${expense.amount.toFixed(2)} • ${expense.status}`,
          entityId: expense.id,
        });
      }
    });

    // Search chats
    chats.forEach((chat) => {
      const matchesName = chat.name.toLowerCase().includes(q);
      const matchesMessages = chat.messages.some((m) => m.text.toLowerCase().includes(q));
      
      if (matchesName || matchesMessages) {
        results.push({
          id: `chat_${chat.id}`,
          type: "chat",
          title: chat.name,
          subtitle: `${chat.messages.length} messages`,
          entityId: chat.id,
        });
      }
    });

    // Search team members
    teamMembers.forEach((member) => {
      const matchesName = member.name.toLowerCase().includes(q);
      const matchesRole = member.role.toLowerCase().includes(q);
      
      if (matchesName || matchesRole) {
        results.push({
          id: `person_${member.id}`,
          type: "person",
          title: member.name,
          subtitle: member.role,
          entityId: member.id,
        });
      }
    });

    return results;
  }, [trips, expenses, chats]);

  const results = useMemo(() => search(query), [query, search]);

  return {
    query,
    setQuery,
    results,
    search,
  };
}
