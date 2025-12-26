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

const STORAGE_KEY = 'flyby_calendar_connection';

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

// Initialize from persisted state
const initialState = loadPersistedState();

// Fake credentials (would be real OAuth tokens in production)
export const MOCK_CREDENTIALS = {
  provider: 'google',
  connected: initialState.connected,
  email: initialState.email,
  accessToken: initialState.connected ? 'mock_access_token_xyz123' : null,
};

// Sample calendar events that suggest travel
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-001',
    title: 'Q1 Sales Kickoff - NYC Office',
    location: 'New York, NY',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    description: 'Annual sales team meeting at headquarters',
  },
  {
    id: 'evt-002',
    title: 'Client Meeting - Acme Corp',
    location: 'Chicago, IL',
    startDate: '2025-02-03',
    endDate: '2025-02-04',
    description: 'Contract renewal discussion',
  },
  {
    id: 'evt-003',
    title: 'Tech Conference 2025',
    location: 'San Francisco, CA',
    startDate: '2025-02-20',
    endDate: '2025-02-22',
    description: 'Annual technology conference and networking event',
  },
  {
    id: 'evt-004',
    title: 'Partner Summit',
    location: 'Austin, TX',
    startDate: '2025-03-10',
    endDate: '2025-03-12',
    description: 'Strategic partner alignment meeting',
  },
];

export async function connectGoogleCalendar(): Promise<{ success: boolean; email: string }> {
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  MOCK_CREDENTIALS.connected = true;
  MOCK_CREDENTIALS.email = 'user@company.com';
  MOCK_CREDENTIALS.accessToken = 'mock_access_token_xyz123';
  
  // Persist the connection
  persistState(true, MOCK_CREDENTIALS.email);
  
  return { success: true, email: MOCK_CREDENTIALS.email };
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
  
  return MOCK_EVENTS;
}

export function isCalendarConnected(): boolean {
  return MOCK_CREDENTIALS.connected;
}

export function getConnectedEmail(): string | null {
  return MOCK_CREDENTIALS.email;
}
