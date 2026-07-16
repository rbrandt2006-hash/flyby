import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTripsTool from "./tools/list-trips";
import getTripTool from "./tools/get-trip";
import listExpensesTool from "./tools/list-expenses";
import getTravelPreferencesTool from "./tools/get-travel-preferences";

// Issuer must be the direct supabase.co host, derived from the project ref
// (Vite inlines VITE_SUPABASE_PROJECT_ID as a build-time literal — import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "flyby-ai-mcp",
  title: "Flyby AI",
  version: "0.1.0",
  instructions:
    "Read the signed-in user's Flyby AI corporate travel data: trips, expenses, and travel preferences. Use list_trips / get_trip to explore itineraries, list_expenses for spend, and get_travel_preferences for airline / hotel / seat preferences.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTripsTool, getTripTool, listExpensesTool, getTravelPreferencesTool],
});
