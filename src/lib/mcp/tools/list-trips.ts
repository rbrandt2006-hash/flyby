import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { pick, queryTable } from "../backendClient";

const FIELDS = [
  "id", "title", "destination", "start_date", "end_date",
  "status", "total_estimated_cost", "purpose",
];

export default defineTool({
  name: "list_trips",
  title: "List trips",
  description: "List the signed-in user's Flyby AI trips, optionally filtered by status.",
  inputSchema: {
    status: z
      .enum(["draft", "pending_approval", "confirmed", "booked", "cancelled", "completed"])
      .optional()
      .describe("Filter by trip status."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const { data, error } = await queryTable<Record<string, unknown>[]>(ctx.getToken(), "trips", {
      filters: status ? [{ column: "status", op: "eq", value: status }] : [],
      order: [{ column: "start_date", ascending: false }],
      limit: limit ?? 25,
    });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const trips = pick(data ?? [], FIELDS);
    return {
      content: [{ type: "text", text: JSON.stringify(trips, null, 2) }],
      structuredContent: { trips },
    };
  },
});
