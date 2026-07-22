import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { pick, queryTable } from "../backendClient";

const FIELDS = [
  "id", "description", "amount", "currency", "category",
  "status", "trip_id", "created_at",
];

export default defineTool({
  name: "list_expenses",
  title: "List expenses",
  description: "List the signed-in user's expenses, optionally filtered by status or trip.",
  inputSchema: {
    status: z.enum(["pending", "submitted", "approved", "rejected"]).optional(),
    trip_id: z.string().uuid().optional().describe("Only expenses for this trip."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, trip_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const filters = [];
    if (status) filters.push({ column: "status", op: "eq", value: status });
    if (trip_id) filters.push({ column: "trip_id", op: "eq", value: trip_id });

    const { data, error } = await queryTable<Record<string, unknown>[]>(ctx.getToken(), "expenses", {
      filters,
      order: [{ column: "created_at", ascending: false }],
      limit: limit ?? 25,
    });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const expenses = pick(data ?? [], FIELDS);
    return {
      content: [{ type: "text", text: JSON.stringify(expenses, null, 2) }],
      structuredContent: { expenses },
    };
  },
});
