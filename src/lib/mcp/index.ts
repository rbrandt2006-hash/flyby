import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTripsTool from "./tools/list-trips";
import getTripTool from "./tools/get-trip";
import listExpensesTool from "./tools/list-expenses";
import getTravelPreferencesTool from "./tools/get-travel-preferences";

// Tokens are issued by the Flyby backend's auth service, so that is the issuer
// MCP clients validate against. Vite inlines this at build time, which keeps
// this module safe to import from anywhere.
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8659";

export default defineMcp({
  name: "flyby-ai-mcp",
  title: "Flyby AI",
  version: "0.1.0",
  instructions:
    "Read the signed-in user's Flyby AI corporate travel data: trips, expenses, and travel preferences. Use list_trips / get_trip to explore itineraries, list_expenses for spend, and get_travel_preferences for airline / hotel / seat preferences.",
  auth: auth.oauth.issuer({
    issuer: `${apiUrl}/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTripsTool, getTripTool, listExpensesTool, getTravelPreferencesTool],
});
