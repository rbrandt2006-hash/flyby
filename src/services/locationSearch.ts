import { AIRPORTS, COUNTRY_ALIASES, US_STATES } from "@/data/globalAirports";

export type LocationSuggestionType = "city" | "state" | "country";

export interface LocationSuggestion {
  id: string;
  type: LocationSuggestionType;
  label: string;
  title: string;
  subtitle: string;
  emoji: string;
  city?: string;
  state?: string;
  country?: string;
  airportCodes: string[];
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function scoreMatch(query: string, candidate: string) {
  const q = normalize(query);
  const c = normalize(candidate);

  if (!q || !c) return -1;
  if (c === q) return 100;
  if (c.startsWith(q)) return 80 - (c.length - q.length) * 0.1;

  const wordIndex = c.split(/\s+/).findIndex((word) => word.startsWith(q));
  if (wordIndex >= 0) return 70 - wordIndex * 2;

  if (c.includes(q)) return 50 - c.indexOf(q) * 0.1;
  return -1;
}

const citySuggestions: LocationSuggestion[] = Object.values(
  AIRPORTS.reduce<Record<string, LocationSuggestion>>((acc, airport) => {
    const key = [airport.city, airport.state || "", airport.country].join("|");
    const existing = acc[key];
    const title = airport.state
      ? `${airport.city}, ${airport.state}`
      : `${airport.city}, ${airport.country}`;

    if (!existing) {
      acc[key] = {
        id: `city:${key}`,
        type: "city",
        label: title,
        title: airport.city,
        subtitle: airport.state
          ? `${airport.state}, ${airport.country}`
          : airport.country,
        emoji: "✈️",
        city: airport.city,
        state: airport.state,
        country: airport.country,
        airportCodes: [airport.code],
      };
    } else if (!existing.airportCodes.includes(airport.code)) {
      existing.airportCodes.push(airport.code);
    }

    return acc;
  }, {})
);

const stateSuggestions: LocationSuggestion[] = Object.entries(US_STATES).map(([state, data]) => ({
  id: `state:${state}`,
  type: "state",
  label: `${state}, USA`,
  title: state,
  subtitle: `${data.abbrev} · ${data.majorAirports.length} major airports`,
  emoji: "📍",
  state,
  country: "USA",
  airportCodes: data.majorAirports,
}));

const countrySuggestions: LocationSuggestion[] = Array.from(
  new Set([
    ...AIRPORTS.map((airport) => airport.country),
    ...Object.values(COUNTRY_ALIASES),
  ])
)
  .sort((a, b) => a.localeCompare(b))
  .map((country) => {
    const airportCodes = AIRPORTS.filter((airport) => airport.country === country).map((airport) => airport.code);

    return {
      id: `country:${country}`,
      type: "country" as const,
      label: country,
      title: country,
      subtitle: airportCodes.length ? `${airportCodes.length} airports in network` : "Country",
      emoji: "🌍",
      country,
      airportCodes,
    };
  });

function rankSuggestions(query: string, suggestions: LocationSuggestion[]) {
  return suggestions
    .map((suggestion) => {
      const score = Math.max(
        scoreMatch(query, suggestion.title),
        scoreMatch(query, suggestion.label),
        scoreMatch(query, suggestion.subtitle)
      );

      return { suggestion, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.suggestion);
}

export function searchGlobalLocations(query: string, limit = 8): LocationSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cities = rankSuggestions(trimmed, citySuggestions);
  const states = rankSuggestions(trimmed, stateSuggestions);
  const countries = rankSuggestions(trimmed, countrySuggestions);

  return [...cities, ...states, ...countries]
    .filter((suggestion, index, arr) => arr.findIndex((item) => item.id === suggestion.id) === index)
    .slice(0, limit);
}

export function extractDestinationSearchQuery(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/(?:to|visit|in|for)\s+([^,]+(?:,\s*[^,]+)?)$/i);
  if (match?.[1]) return match[1].trim();

  return trimmed.length <= 40 ? trimmed : "";
}

export function resolveBestLocation(query: string) {
  return searchGlobalLocations(query, 1)[0] ?? null;
}
