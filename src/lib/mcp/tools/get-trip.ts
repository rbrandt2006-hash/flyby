import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { queryTable } from "../backendClient";

export default defineTool({
  name: "get_trip",
  title: "Get trip",
  description: "Fetch full details for one of the signed-in user's trips by id, including flight and hotel details.",
  inputSchema: {
    trip_id: z.string().uuid().describe("Trip id (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trip_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const { data, error } = await queryTable<Record<string, unknown> | null>(ctx.getToken(), "trips", {
      filters: [{ column: "id", op: "eq", value: trip_id }],
      single: "maybe",
    });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Trip not found" }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { trip: data },
    };
  },
});
