import { useCallback, useEffect, useState } from "react";

/**
 * How much of a trip Flyby handles on its own.
 *
 *  - "manual"      the traveler picks a flight, then a hotel (the original flow)
 *  - "autonomous"  Flyby picks the flight and hotel from their preferences and
 *                  company policy and takes them straight to payment
 *
 * "approval" was a third mode that assembled an itinerary and waited for a
 * separate OK. It was removed as redundant — the payment step is already the
 * confirmation. Anyone who had it selected is migrated to "autonomous", which
 * is the mode that keeps the automation they opted into.
 *
 * Stored locally rather than on the traveller's profile: it is a per-device
 * choice, it works for guests who have no profile row, and it needs no schema
 * change to an already-deployed database.
 */
export type BookingMode = "manual" | "autonomous";

const STORAGE_KEY = "flyby.bookingMode.v1";
/** The original on/off setting, migrated on first read so nobody loses it. */
const LEGACY_KEY = "flyby.autoPlan.v1";
const CHANGE_EVENT = "flyby:bookingmode-changed";

function read(): BookingMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "manual" || stored === "autonomous") return stored;
    // The retired "approval" mode, and the boolean before it, both meant
    // "Flyby assembles it for me" — carry that intent over.
    if (stored === "approval") return "autonomous";
    if (localStorage.getItem(LEGACY_KEY) === "true") return "autonomous";
    return "manual";
  } catch {
    return "manual";
  }
}

export function useBookingMode() {
  const [mode, setModeState] = useState<BookingMode>(read);

  // Keep every mounted copy in sync — Settings and the Dashboard read this at
  // the same time and the change must take effect immediately.
  useEffect(() => {
    const sync = () => setModeState(read());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((next: BookingMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the setting still applies for this session */
    }
    setModeState(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    mode,
    setMode,
    /** True when Flyby should assemble the itinerary itself. */
    autoPlan: mode === "autonomous",
    /** True when it should also book it without waiting to be told. */
    autoBook: mode === "autonomous",
  };
}

/**
 * Backwards-compatible shim for call sites that only care whether Flyby
 * assembles the itinerary.
 */
export function useAutoPlan() {
  const { autoPlan, autoBook, mode, setMode } = useBookingMode();
  return { autoPlan, autoBook, mode, setMode };
}
