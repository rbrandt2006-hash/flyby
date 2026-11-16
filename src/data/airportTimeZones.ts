/**
 * The time zone a destination keeps.
 *
 * A calendar says a meeting is at an instant in time; a flight says it lands at
 * a local clock time. To tell whether a flight lands before a meeting, the
 * meeting has to be read on the destination's clock — a 9 AM meeting in Chicago
 * is 7 AM on a San Diego traveler's calendar.
 *
 * Deliberately conservative: `undefined` when the zone isn't known for certain.
 * A wrong zone would move a meeting by hours and recommend a flight that lands
 * after it starts; an unknown one just means Flyby plans around the day rather
 * than the hour (see services/calendarTrips.ts).
 */

import type { Airport } from "@/data/globalAirports";

// One zone covers each state's airports in the airport list. States split
// across zones are mapped by where their major airports are.
const US_STATE: Record<string, string> = {
  Alabama: "America/Chicago", Alaska: "America/Anchorage", Arizona: "America/Phoenix",
  Arkansas: "America/Chicago", California: "America/Los_Angeles", Colorado: "America/Denver",
  Connecticut: "America/New_York", Delaware: "America/New_York", "District of Columbia": "America/New_York",
  Florida: "America/New_York", Georgia: "America/New_York", Hawaii: "Pacific/Honolulu",
  Idaho: "America/Boise", Illinois: "America/Chicago", Indiana: "America/Indiana/Indianapolis",
  Iowa: "America/Chicago", Kansas: "America/Chicago", Kentucky: "America/New_York",
  Louisiana: "America/Chicago", Maine: "America/New_York", Maryland: "America/New_York",
  Massachusetts: "America/New_York", Michigan: "America/Detroit", Minnesota: "America/Chicago",
  Mississippi: "America/Chicago", Missouri: "America/Chicago", Montana: "America/Denver",
  Nebraska: "America/Chicago", Nevada: "America/Los_Angeles", "New Hampshire": "America/New_York",
  "New Jersey": "America/New_York", "New Mexico": "America/Denver", "New York": "America/New_York",
  "North Carolina": "America/New_York", "North Dakota": "America/Chicago", Ohio: "America/New_York",
  Oklahoma: "America/Chicago", Oregon: "America/Los_Angeles", Pennsylvania: "America/New_York",
  "Rhode Island": "America/New_York", "South Carolina": "America/New_York", "South Dakota": "America/Chicago",
  Tennessee: "America/Chicago", Texas: "America/Chicago", Utah: "America/Denver",
  Vermont: "America/New_York", Virginia: "America/New_York", Washington: "America/Los_Angeles",
  "West Virginia": "America/New_York", Wisconsin: "America/Chicago", Wyoming: "America/Denver",
};

// Cities whose zone differs from the rest of their state or country, or whose
// country spans several.
const CITY: Record<string, string> = {
  // United States
  "washington": "America/New_York", "washington dc": "America/New_York", "el paso": "America/Denver",
  "knoxville": "America/New_York", "pensacola": "America/Chicago", "louisville": "America/New_York",
  // Canada
  "toronto": "America/Toronto", "montreal": "America/Toronto", "ottawa": "America/Toronto",
  "vancouver": "America/Vancouver", "calgary": "America/Edmonton", "edmonton": "America/Edmonton",
  "winnipeg": "America/Winnipeg", "halifax": "America/Halifax",
  // Mexico
  "mexico city": "America/Mexico_City", "guadalajara": "America/Mexico_City", "monterrey": "America/Monterrey",
  "cancun": "America/Cancun", "tijuana": "America/Tijuana",
  // Brazil
  "sao paulo": "America/Sao_Paulo", "são paulo": "America/Sao_Paulo", "rio de janeiro": "America/Sao_Paulo",
  "brasilia": "America/Sao_Paulo", "brasília": "America/Sao_Paulo", "belo horizonte": "America/Sao_Paulo",
  "curitiba": "America/Sao_Paulo", "porto alegre": "America/Sao_Paulo",
  // Australia
  "sydney": "Australia/Sydney", "melbourne": "Australia/Melbourne", "brisbane": "Australia/Brisbane",
  "gold coast": "Australia/Brisbane", "cairns": "Australia/Brisbane", "perth": "Australia/Perth",
  "adelaide": "Australia/Adelaide",
  // Spain's Canary Islands, Portugal's Azores
  "tenerife": "Atlantic/Canary", "las palmas": "Atlantic/Canary", "gran canaria": "Atlantic/Canary",
  "lanzarote": "Atlantic/Canary", "fuerteventura": "Atlantic/Canary", "ponta delgada": "Atlantic/Azores",
  "hong kong": "Asia/Hong_Kong",
  // Russia, Indonesia
  "moscow": "Europe/Moscow", "st. petersburg": "Europe/Moscow", "jakarta": "Asia/Jakarta",
  "denpasar": "Asia/Makassar",
};

// Countries that keep a single zone.
const COUNTRY: Record<string, string> = {
  UK: "Europe/London", "United Kingdom": "Europe/London", Ireland: "Europe/Dublin", France: "Europe/Paris",
  Germany: "Europe/Berlin", Netherlands: "Europe/Amsterdam", Belgium: "Europe/Brussels", Spain: "Europe/Madrid",
  Italy: "Europe/Rome", Switzerland: "Europe/Zurich", Austria: "Europe/Vienna", Sweden: "Europe/Stockholm",
  Norway: "Europe/Oslo", Denmark: "Europe/Copenhagen", Finland: "Europe/Helsinki", Poland: "Europe/Warsaw",
  Romania: "Europe/Bucharest", Greece: "Europe/Athens", Turkey: "Europe/Istanbul", Portugal: "Europe/Lisbon",
  UAE: "Asia/Dubai", Qatar: "Asia/Qatar", "Saudi Arabia": "Asia/Riyadh", Kuwait: "Asia/Kuwait",
  Oman: "Asia/Muscat", Lebanon: "Asia/Beirut", Egypt: "Africa/Cairo", Morocco: "Africa/Casablanca",
  "South Africa": "Africa/Johannesburg", Kenya: "Africa/Nairobi", Nigeria: "Africa/Lagos",
  India: "Asia/Kolkata", China: "Asia/Shanghai", Japan: "Asia/Tokyo", "South Korea": "Asia/Seoul",
  Singapore: "Asia/Singapore", Taiwan: "Asia/Taipei", Thailand: "Asia/Bangkok", Vietnam: "Asia/Ho_Chi_Minh",
  Malaysia: "Asia/Kuala_Lumpur", Philippines: "Asia/Manila", Macau: "Asia/Macau", "Hong Kong": "Asia/Hong_Kong",
  "New Zealand": "Pacific/Auckland", Argentina: "America/Argentina/Buenos_Aires", Colombia: "America/Bogota",
  Peru: "America/Lima", Panama: "America/Panama", "Costa Rica": "America/Costa_Rica", Jamaica: "America/Jamaica",
  "Puerto Rico": "America/Puerto_Rico", "Dominican Republic": "America/Santo_Domingo",
};

/** The IANA time zone an airport's city keeps, or undefined when not known for certain. */
export function timeZoneForAirport(airport: Pick<Airport, "city" | "country" | "state">): string | undefined {
  const city = (airport.city || "").trim().toLowerCase();
  if (CITY[city]) return CITY[city];
  if (airport.country === "USA" || airport.country === "United States") {
    return airport.state ? US_STATE[airport.state] : undefined;
  }
  return COUNTRY[airport.country];
}
