import { authedFetch } from "@/integrations/backend/client";

/**
 * Open Flyby's operations console (the backend site) already signed in as the
 * same account, with no second sign-in.
 *
 * The backend gives a one-time link that lasts 60 seconds. The new tab is opened
 * straight away, inside the click, so pop-up blockers allow it, and is pointed
 * at the link once it arrives. Throws with a readable message on failure.
 */
export async function openConsole(next = "/companies"): Promise<void> {
  const tab = window.open("", "_blank");
  try {
    const response = await authedFetch("/api/console/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.url) throw new Error(body.message || "Couldn't open the console. Try again.");
    if (tab) tab.location.href = body.url;
    else window.location.href = body.url;
  } catch (error) {
    tab?.close();
    throw error instanceof Error ? error : new Error("Couldn't open the console. Try again.");
  }
}
