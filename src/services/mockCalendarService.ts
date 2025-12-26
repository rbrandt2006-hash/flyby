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

// Fake credentials (would be real OAuth tokens in production)
export const MOCK_CREDENTIALS = {
  provider: 'google',
  connected: false,
  email: null as string | null,
  accessToken: null as string | null,
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
  
  return { success: true, email: MOCK_CREDENTIALS.email };
}

export async function disconnectCalendar(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  MOCK_CREDENTIALS.connected = false;
  MOCK_CREDENTIALS.email = null;
  MOCK_CREDENTIALS.accessToken = null;
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
