/**
 * Does this flight or hotel match what the traveler said they prefer?
 *
 * Preferences are typed by people and results come from suppliers, and the two
 * rarely spell things the same way. The planner used to compare them exactly,
 * so "Delta" never matched Duffel's "Delta Air Lines" and the preference was
 * silently ignored. These matchers bridge the gap without getting loose enough
 * to match the wrong carrier or brand.
 */

import { AIRLINES } from "@/data/globalAirlines";

/**
 * Edit distance, for forgiving a typo in a typed preference. Counts swapping
 * two neighbouring letters as one edit ("alsaka" → "alaska"), since that's the
 * most common slip when typing a name.
 */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * The known name a typed one was probably meant to be — "marriot" → "marriott".
 *
 * Preferences are typed once in Settings and then silently fail to match for
 * every trip afterward, so a one-letter slip shouldn't cost the traveler their
 * preference. Kept tight: one edit for short names, two for long ones, and
 * nothing under five letters, where a single edit can land on another brand.
 */
function closestKnown(typed: string, known: string[]): string | null {
  if (typed.length < 5) return null;
  const allowed = typed.length >= 9 ? 2 : 1;
  let best: string | null = null;
  let bestDistance = allowed + 1;
  for (const candidate of known) {
    const d = editDistance(typed, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Airlines
// ---------------------------------------------------------------------------

/** Generic words that say nothing about which airline it is. */
const AIRLINE_SUFFIX = /\s+(air\s+lines|airlines|airline|airways|international)$/;

/** "Delta Air Lines" → "delta"; "Air Canada" stays "air canada". */
export function normalizeAirline(name: string): string {
  let out = name.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  let previous = "";
  while (out !== previous) {
    previous = out;
    out = out.replace(AIRLINE_SUFFIX, "").trim();
  }
  return out;
}

/** The two-character IATA code at the front of a flight number: "DL 123" → "DL". */
function codeFromFlightNumber(flightNumber?: string): string | null {
  const match = (flightNumber || "").trim().toUpperCase().match(/^([A-Z0-9]{2})(?=\s*\d)/);
  return match ? match[1] : null;
}

interface AirlineKey {
  name: string;
  code: string | null;
}

/** What a typed preference refers to: a code ("DL"), a name ("Delta"), or both. */
function resolvePreference(pref: string): AirlineKey | null {
  const raw = pref.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const normalized = normalizeAirline(raw);

  if (/^[A-Z0-9]{2}$/.test(upper)) {
    const byCode = AIRLINES.find((a) => a.code === upper);
    return { name: byCode ? normalizeAirline(byCode.name) : "", code: upper };
  }
  const byName = AIRLINES.find((a) => normalizeAirline(a.name) === normalized);
  if (byName) return { name: normalized, code: byName.code };
  // A typo ("Alsaka") still resolves to the airline it was meant to be.
  const corrected = closestKnown(normalized, AIRLINES.map((a) => normalizeAirline(a.name)));
  if (corrected) {
    const airline = AIRLINES.find((a) => normalizeAirline(a.name) === corrected);
    return { name: corrected, code: airline?.code ?? null };
  }
  return { name: normalized, code: null };
}

/** Words too generic to identify a carrier on their own. */
const TOO_GENERIC = new Set(["air", "airline", "airlines", "airways", "the"]);

/**
 * Whether a flight is on one of the traveler's preferred airlines.
 *
 * Matches on IATA code when both sides have one, otherwise on the normalized
 * name — equal, or the preference as the leading word(s) of the carrier name
 * ("Virgin" → "Virgin Atlantic"). Never on a bare substring, which would let
 * "Air" match every Air-something carrier.
 */
export function matchesPreferredAirline(
  flight: { airline: string; flightNumber?: string },
  preferences: string[],
): boolean {
  if (!preferences?.length) return false;
  const flightName = normalizeAirline(flight.airline || "");
  const flightCode = codeFromFlightNumber(flight.flightNumber);

  return preferences.some((pref) => {
    const key = resolvePreference(pref);
    if (!key) return false;
    if (key.code && flightCode && key.code === flightCode) return true;
    if (!key.name || TOO_GENERIC.has(key.name)) return false;
    return flightName === key.name || flightName.startsWith(`${key.name} `);
  });
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

/**
 * Brands that belong to the same loyalty program.
 *
 * Someone who says "Hilton" almost always means "somewhere I earn Hilton
 * points", and a DoubleTree or Hampton Inn does that. Listing the families keeps
 * the preference useful without treating unrelated hotels as a match.
 */
const HOTEL_FAMILIES: Record<string, string[]> = {
  marriott: [
    "marriott", "courtyard", "residence inn", "fairfield", "ac hotel", "aloft",
    "westin", "sheraton", "w hotel", "ritz carlton", "jw marriott",
  ],
  hilton: ["hilton", "doubletree", "hampton inn", "embassy suites"],
  hyatt: ["hyatt"],
  ihg: ["intercontinental", "holiday inn", "crowne plaza", "kimpton"],
  "four seasons": ["four seasons"],
  omni: ["omni"],
  radisson: ["radisson"],
  "best western": ["best western"],
};

/** Words in a typed brand that aren't part of the brand. */
const HOTEL_NOISE = /\b(hotels?|resorts?|and|bonvoy|honors|rewards|one|by)\b|&/g;

function normalizeHotel(text: string): string {
  return text
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(HOTEL_NOISE, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every brand name the matcher knows, normalized: families and their members. */
const KNOWN_HOTEL_BRANDS = Array.from(new Set([
  ...Object.keys(HOTEL_FAMILIES),
  ...Object.values(HOTEL_FAMILIES).flat(),
].map(normalizeHotel)));

/** A typed brand, corrected if it's a near-miss of a known one ("marriot"). */
function resolveHotelBrand(brand: string): string {
  if (HOTEL_FAMILIES[brand] || KNOWN_HOTEL_BRANDS.includes(brand)) return brand;
  return closestKnown(brand, KNOWN_HOTEL_BRANDS) ?? brand;
}

/** Whole-word containment, so "inn" can't match "Westin". */
function containsPhrase(haystack: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${haystack} `.includes(` ${phrase} `);
}

/**
 * The preferred brand a hotel matches, if any — returned so the explanation
 * can say which one ("part of Hilton"), not just that something matched.
 */
export function matchedHotelBrand(hotelName: string, preferences: string[]): string | null {
  if (!preferences?.length) return null;
  const name = normalizeHotel(hotelName);

  for (const pref of preferences) {
    const brand = normalizeHotel(pref);
    if (!brand) continue;
    // A program name ("Hilton") covers its family; a specific sub-brand
    // ("Courtyard") means that brand only.
    const targets = HOTEL_FAMILIES[resolveHotelBrand(brand)] ?? [resolveHotelBrand(brand)];
    if (targets.some((member) => containsPhrase(name, normalizeHotel(member)))) return pref.trim();
  }
  return null;
}
