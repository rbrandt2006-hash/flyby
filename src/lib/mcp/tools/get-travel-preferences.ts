import { defineTool } from "@lovable.dev/mcp-js";
import { queryTable } from "../backendClient";

export default defineTool({
  name: "get_travel_preferences",
  title: "Get travel preferences",
  description: "Get the signed-in user's saved travel preferences (airlines, hotel brands, seat, cost sensitivity, avoid layovers).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    // The backend scopes every read to the token's owner, so no user filter is
    // needed here — and none can be supplied to widen it.
    const { data, error } = await queryTable<Record<string, unknown> | null>(
      ctx.getToken(),
      "travel_preferences",
      { single: "maybe" },
    );

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? {}, null, 2) }],
      structuredContent: { preferences: data ?? null },
    };
  },
});
