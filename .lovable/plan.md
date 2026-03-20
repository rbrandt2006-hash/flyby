

## Fix the AI Flight Booker Bar

### Problems identified

1. **Destination resolution fails on natural language input.** `resolveBestLocation("houston to sf from 2/10-3/19")` tries to match the *entire prompt* as a location name. It scores "houston to sf from 2/10-3/19" against "San Francisco" and gets no match, so `needsDestination` fires and nothing renders. This is why the spinner appears then disappears with no result.

2. **No flight results shown.** Even when a destination resolves, only a static itinerary summary card appears. The user wants selectable flight result cards.

3. **Form submit works (console logs confirm "submitted") but the pipeline silently fails** due to issue #1 above.

### Plan

#### Step 1 — Fix destination extraction in `generateTripPlan` (Dashboard.tsx)

Replace the call to `resolveBestLocation(prompt)` with `parseTravelRequest(prompt)` from `travelSearchParser.ts`, which already handles natural language patterns like "houston to sf from 2/10-3/19". Use the parsed origin and destination airports instead of the basic location search. Fall back to `resolveBestLocation` only if `parseTravelRequest` finds no destination.

Also use `parseTravelRequest`'s extracted dates instead of `parseDates` from `tripTemplates.ts`, since `parseTravelRequest` already handles date ranges like "2/10-3/19".

#### Step 2 — Show selectable flight results after search (Dashboard.tsx)

After `generateTripPlan` succeeds, generate mock flight results (using `generateMockFlights` from `mockFlightService.ts`) and store them in state. Render a flight results list below the command bar using the existing `FlightResults` component, allowing the user to pick a specific flight. Once selected, populate the itinerary card with that flight's details.

New state additions:
- `flightResults: Flight[]` — populated after plan generation
- `selectedFlightFromResults: Flight | null` — set when user clicks "Select"

Flow: Input → parse → show flight cards → user selects → show full itinerary summary with selected flight.

#### Step 3 — Wire selected flight into itinerary and draft creation

When a flight is selected from the results list, update `planResult` with the real flight data (airline, flight number, times, price) and show the itinerary card. The "Save as Draft" button already works from there.

### Files to modify

- `src/pages/Dashboard.tsx` — fix parsing pipeline, add flight results state and UI
- No new files needed; leverages existing `parseTravelRequest`, `FlightResults`, and `generateMockFlights`

### Technical details

The key fix is in `generateTripPlan`:
```
// Before (broken):
const destination = resolveBestLocation(prompt);  // fails on NL input

// After (fixed):
const parsed = parseTravelRequest(prompt);
const destAirport = parsed.destination?.airports[0];
// Falls back to resolveBestLocation if parseTravelRequest misses
```

The `parseTravelRequest` function already handles:
- "to SF" / "to San Francisco" patterns
- "from Houston" origin extraction  
- "2/10-3/19" date range parsing
- Airport code resolution (SF → SFO, Houston → IAH)

