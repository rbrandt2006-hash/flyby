// Mock Calendar Service - Simulates Google Calendar API
// In production, replace with real OAuth flow and API calls

export interface CalendarEvent {
  id: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string;
  description: string | null;
}

export interface CreateCalendarEventParams {
  title: string;
  location: string | null;
  startDate: string;
  endDate: string;
  description: string | null;
}

const STORAGE_KEY = 'flyby_calendar_connection';
const CREATED_EVENTS_KEY = 'flyby_created_calendar_events';

// Load persisted state from localStorage
function loadPersistedState(): { connected: boolean; email: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load calendar state:', e);
  }
  return { connected: false, email: null };
}

// Save state to localStorage
function persistState(connected: boolean, email: string | null): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected, email }));
  } catch (e) {
    console.error('Failed to persist calendar state:', e);
  }
}

// Load created events from localStorage (full event records keyed by tripId)
function loadCreatedEvents(): Record<string, CalendarEvent> {
  try {
    const stored = localStorage.getItem(CREATED_EVENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old format (tripId -> eventId string) to new format
      const migrated: Record<string, CalendarEvent> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "object" && v !== null && "id" in (v as any)) {
          migrated[k] = v as CalendarEvent;
        }
      }
      return migrated;
    }
  } catch (e) {
    console.error('Failed to load created events:', e);
  }
  return {};
}

// Save created events to localStorage
function saveCreatedEvents(events: Record<string, CalendarEvent>): void {
  try {
    localStorage.setItem(CREATED_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save created events:', e);
  }
}

// Initialize from persisted state
const initialState = loadPersistedState();

// Fake credentials (would be real OAuth tokens in production)
export const MOCK_CREDENTIALS = {
  provider: 'google',
  connected: initialState.connected,
  email: initialState.email,
  accessToken: initialState.connected ? 'mock_access_token_xyz123' : null,
};

// Sample calendar events that suggest travel — dates generated relative to today
// so the synced-calendar demo always looks current.
function relDate(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getMockEvents(): CalendarEvent[] {
  // No fabricated meetings. Events come from the traveler's real Google
  // Calendar once it's connected; inventing them here produced phantom
  // "detected trips" that had no basis in anyone's actual schedule.
  return [];
}


export async function connectGoogleCalendar(_email?: string): Promise<{ success: boolean; email: string }> {
  // Calendar sync is not available yet. It used to simulate a successful
  // connection and hand back a fake token, which made the rest of the app
  // behave as though a real calendar was attached. Refuse instead, so the UI
  // can show "Coming soon" truthfully.
  //
  // Once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are configured, the real flow
  // lives in services/googleCalendar.ts (OAuth via the backend).
  throw new Error("Google Calendar sync isn't available yet.");
}

export async function disconnectCalendar(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  MOCK_CREDENTIALS.connected = false;
  MOCK_CREDENTIALS.email = null;
  MOCK_CREDENTIALS.accessToken = null;
  
  // Clear persisted state
  persistState(false, null);
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  if (!MOCK_CREDENTIALS.connected) {
    throw new Error('Calendar not connected');
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Merge demo events with events created from booked trips
  const created = Object.values(loadCreatedEvents());
  // Sort by startDate ascending
  return [...getMockEvents(), ...created].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
}

export function isCalendarConnected(): boolean {
  return MOCK_CREDENTIALS.connected;
}

export function getConnectedEmail(): string | null {
  return MOCK_CREDENTIALS.email;
}

/**
 * Create a calendar event for a confirmed trip
 * Returns the created event ID
 */
export async function createCalendarEvent(
  tripId: string,
  params: CreateCalendarEventParams
): Promise<{ success: boolean; eventId: string; error?: string }> {
  if (!MOCK_CREDENTIALS.connected) {
    return {
      success: false,
      eventId: '',
      error: 'Calendar not connected. Please connect your calendar first.'
    };
  }

  // Check for duplicate - idempotent
  const createdEvents = loadCreatedEvents();
  if (createdEvents[tripId]) {
    return { success: true, eventId: createdEvents[tripId].id };
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // Create mock event ID
  const eventId = `cal_evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const event: CalendarEvent = {
    id: eventId,
    title: params.title,
    location: params.location,
    startDate: params.startDate,
    endDate: params.endDate,
    description: params.description,
  };

  createdEvents[tripId] = event;
  saveCreatedEvents(createdEvents);

  return { success: true, eventId };
}

/**
 * Delete a calendar event (e.g., when trip is cancelled)
 */
export async function deleteCalendarEvent(tripId: string): Promise<{ success: boolean }> {
  const createdEvents = loadCreatedEvents();
  
  if (createdEvents[tripId]) {
    delete createdEvents[tripId];
    saveCreatedEvents(createdEvents);
  }

  return { success: true };
}

/**
 * Check if a trip already has a calendar event
 */
export function hasCalendarEvent(tripId: string): boolean {
  const createdEvents = loadCreatedEvents();
  return !!createdEvents[tripId];
}
