// Comprehensive Global Airline Database
// Includes carrier types, hub airports, and regional coverage

export interface Airline {
  code: string; // IATA code
  icao?: string; // ICAO code
  name: string;
  logo: string; // Emoji representation
  type: "major" | "regional" | "low-cost" | "ultra-low-cost";
  alliance?: "Star Alliance" | "oneworld" | "SkyTeam";
  country: string;
  hubs: string[]; // IATA codes of hub airports
  regions: string[]; // Operating regions
}

export const AIRLINES: Airline[] = [
  // ===== UNITED STATES =====
  // Major Carriers
  { code: "AA", icao: "AAL", name: "American Airlines", logo: "🦅", type: "major", alliance: "oneworld", country: "USA", hubs: ["DFW", "CLT", "MIA", "ORD", "PHX", "PHL", "LAX", "JFK"], regions: ["North America", "Europe", "Asia", "Latin America", "Caribbean"] },
  { code: "DL", icao: "DAL", name: "Delta Air Lines", logo: "🔺", type: "major", alliance: "SkyTeam", country: "USA", hubs: ["ATL", "DTW", "MSP", "SLC", "SEA", "LAX", "JFK", "BOS"], regions: ["North America", "Europe", "Asia", "Latin America", "Caribbean", "Africa"] },
  { code: "UA", icao: "UAL", name: "United Airlines", logo: "🌐", type: "major", alliance: "Star Alliance", country: "USA", hubs: ["ORD", "DEN", "IAH", "EWR", "SFO", "LAX", "IAD"], regions: ["North America", "Europe", "Asia", "Latin America", "Caribbean", "Oceania"] },
  { code: "WN", icao: "SWA", name: "Southwest Airlines", logo: "❤️", type: "low-cost", country: "USA", hubs: ["DAL", "MDW", "DEN", "PHX", "LAS", "BWI", "HOU"], regions: ["North America", "Caribbean", "Central America"] },
  { code: "B6", icao: "JBU", name: "JetBlue Airways", logo: "💙", type: "low-cost", country: "USA", hubs: ["JFK", "BOS", "FLL", "LAX", "SJU"], regions: ["North America", "Caribbean", "Latin America", "Europe"] },
  { code: "AS", icao: "ASA", name: "Alaska Airlines", logo: "🏔️", type: "major", alliance: "oneworld", country: "USA", hubs: ["SEA", "PDX", "SFO", "LAX", "ANC"], regions: ["North America", "Mexico", "Costa Rica"] },
  { code: "NK", icao: "NKS", name: "Spirit Airlines", logo: "💛", type: "ultra-low-cost", country: "USA", hubs: ["FLL", "LAS", "ORD", "DFW", "ATL"], regions: ["North America", "Caribbean", "Latin America"] },
  { code: "F9", icao: "FFT", name: "Frontier Airlines", logo: "🦌", type: "ultra-low-cost", country: "USA", hubs: ["DEN", "LAS", "MCO", "PHX", "ATL"], regions: ["North America", "Caribbean", "Mexico"] },
  { code: "HA", icao: "HAL", name: "Hawaiian Airlines", logo: "🌺", type: "major", alliance: "oneworld", country: "USA", hubs: ["HNL", "OGG", "LIH", "KOA"], regions: ["Hawaii", "North America", "Asia", "Oceania"] },
  { code: "SY", icao: "SCX", name: "Sun Country Airlines", logo: "☀️", type: "low-cost", country: "USA", hubs: ["MSP"], regions: ["North America", "Caribbean", "Mexico"] },
  { code: "G4", icao: "AAY", name: "Allegiant Air", logo: "🟠", type: "ultra-low-cost", country: "USA", hubs: ["LAS"], regions: ["North America"] },
  
  // ===== EUROPE =====
  // UK & Ireland
  { code: "BA", icao: "BAW", name: "British Airways", logo: "🇬🇧", type: "major", alliance: "oneworld", country: "UK", hubs: ["LHR", "LGW"], regions: ["Europe", "North America", "Asia", "Africa", "Middle East", "Oceania"] },
  { code: "VS", icao: "VIR", name: "Virgin Atlantic", logo: "❤️", type: "major", alliance: "SkyTeam", country: "UK", hubs: ["LHR", "MAN"], regions: ["North America", "Caribbean", "Asia", "Africa", "Middle East"] },
  { code: "EI", icao: "EIN", name: "Aer Lingus", logo: "☘️", type: "major", country: "Ireland", hubs: ["DUB"], regions: ["Europe", "North America"] },
  { code: "U2", icao: "EZY", name: "easyJet", logo: "🟠", type: "low-cost", country: "UK", hubs: ["LGW", "LTN", "MAN", "BRS"], regions: ["Europe", "North Africa"] },
  { code: "FR", icao: "RYR", name: "Ryanair", logo: "💛", type: "ultra-low-cost", country: "Ireland", hubs: ["DUB", "STN", "BGY", "CIA"], regions: ["Europe", "North Africa", "Middle East"] },
  
  // Germany
  { code: "LH", icao: "DLH", name: "Lufthansa", logo: "🇩🇪", type: "major", alliance: "Star Alliance", country: "Germany", hubs: ["FRA", "MUC"], regions: ["Europe", "North America", "Asia", "Africa", "Middle East", "South America"] },
  { code: "EW", icao: "EWG", name: "Eurowings", logo: "🟣", type: "low-cost", country: "Germany", hubs: ["DUS", "CGN", "STR"], regions: ["Europe"] },
  
  // France
  { code: "AF", icao: "AFR", name: "Air France", logo: "🇫🇷", type: "major", alliance: "SkyTeam", country: "France", hubs: ["CDG", "ORY"], regions: ["Europe", "North America", "Asia", "Africa", "Caribbean", "South America", "Middle East"] },
  { code: "TO", icao: "TVF", name: "Transavia France", logo: "💚", type: "low-cost", country: "France", hubs: ["ORY", "NTE"], regions: ["Europe", "North Africa"] },
  
  // Netherlands
  { code: "KL", icao: "KLM", name: "KLM Royal Dutch Airlines", logo: "🇳🇱", type: "major", alliance: "SkyTeam", country: "Netherlands", hubs: ["AMS"], regions: ["Europe", "North America", "Asia", "Africa", "Caribbean", "South America"] },
  
  // Spain
  { code: "IB", icao: "IBE", name: "Iberia", logo: "🇪🇸", type: "major", alliance: "oneworld", country: "Spain", hubs: ["MAD"], regions: ["Europe", "North America", "Latin America", "Africa"] },
  { code: "VY", icao: "VLG", name: "Vueling", logo: "🟡", type: "low-cost", country: "Spain", hubs: ["BCN", "MAD"], regions: ["Europe"] },
  
  // Italy
  { code: "AZ", icao: "ITY", name: "ITA Airways", logo: "🇮🇹", type: "major", alliance: "SkyTeam", country: "Italy", hubs: ["FCO", "LIN"], regions: ["Europe", "North America", "Asia", "Africa", "South America"] },
  
  // Scandinavia
  { code: "SK", icao: "SAS", name: "SAS Scandinavian Airlines", logo: "🇸🇪", type: "major", alliance: "SkyTeam", country: "Sweden", hubs: ["CPH", "ARN", "OSL"], regions: ["Europe", "North America", "Asia"] },
  { code: "AY", icao: "FIN", name: "Finnair", logo: "🇫🇮", type: "major", alliance: "oneworld", country: "Finland", hubs: ["HEL"], regions: ["Europe", "Asia", "North America"] },
  { code: "DY", icao: "NAX", name: "Norwegian Air Shuttle", logo: "🔴", type: "low-cost", country: "Norway", hubs: ["OSL", "BGO", "TRD"], regions: ["Europe", "North America"] },
  
  // Switzerland & Austria
  { code: "LX", icao: "SWR", name: "Swiss International Air Lines", logo: "🇨🇭", type: "major", alliance: "Star Alliance", country: "Switzerland", hubs: ["ZRH", "GVA"], regions: ["Europe", "North America", "Asia", "Africa", "South America"] },
  { code: "OS", icao: "AUA", name: "Austrian Airlines", logo: "🇦🇹", type: "major", alliance: "Star Alliance", country: "Austria", hubs: ["VIE"], regions: ["Europe", "Asia", "Africa", "North America"] },
  
  // Portugal
  { code: "TP", icao: "TAP", name: "TAP Air Portugal", logo: "🇵🇹", type: "major", alliance: "Star Alliance", country: "Portugal", hubs: ["LIS", "OPO"], regions: ["Europe", "North America", "South America", "Africa"] },
  
  // Turkey
  { code: "TK", icao: "THY", name: "Turkish Airlines", logo: "🇹🇷", type: "major", alliance: "Star Alliance", country: "Turkey", hubs: ["IST", "SAW"], regions: ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"] },
  { code: "PC", icao: "PGT", name: "Pegasus Airlines", logo: "🟢", type: "low-cost", country: "Turkey", hubs: ["SAW"], regions: ["Europe", "Middle East", "Asia"] },
  
  // Eastern Europe
  { code: "LO", icao: "LOT", name: "LOT Polish Airlines", logo: "🇵🇱", type: "major", alliance: "Star Alliance", country: "Poland", hubs: ["WAW"], regions: ["Europe", "North America", "Asia"] },
  { code: "OK", icao: "CSA", name: "Czech Airlines", logo: "🇨🇿", type: "major", alliance: "SkyTeam", country: "Czech Republic", hubs: ["PRG"], regions: ["Europe"] },
  
  // Greece
  { code: "A3", icao: "AEE", name: "Aegean Airlines", logo: "🇬🇷", type: "major", alliance: "Star Alliance", country: "Greece", hubs: ["ATH"], regions: ["Europe", "Middle East"] },
  
  // Iceland
  { code: "FI", icao: "ICE", name: "Icelandair", logo: "🇮🇸", type: "major", country: "Iceland", hubs: ["KEF"], regions: ["Europe", "North America"] },
  
  // ===== MIDDLE EAST =====
  { code: "EK", icao: "UAE", name: "Emirates", logo: "🇦🇪", type: "major", country: "UAE", hubs: ["DXB"], regions: ["Europe", "North America", "Asia", "Africa", "Oceania", "South America"] },
  { code: "QR", icao: "QTR", name: "Qatar Airways", logo: "🇶🇦", type: "major", alliance: "oneworld", country: "Qatar", hubs: ["DOH"], regions: ["Europe", "North America", "Asia", "Africa", "Oceania", "South America"] },
  { code: "EY", icao: "ETD", name: "Etihad Airways", logo: "🇦🇪", type: "major", country: "UAE", hubs: ["AUH"], regions: ["Europe", "North America", "Asia", "Africa", "Oceania"] },
  { code: "SV", icao: "SVA", name: "Saudia", logo: "🇸🇦", type: "major", alliance: "SkyTeam", country: "Saudi Arabia", hubs: ["JED", "RUH"], regions: ["Middle East", "Asia", "Africa", "Europe"] },
  { code: "GF", icao: "GFA", name: "Gulf Air", logo: "🇧🇭", type: "major", country: "Bahrain", hubs: ["BAH"], regions: ["Middle East", "Asia", "Europe"] },
  { code: "WY", icao: "OMA", name: "Oman Air", logo: "🇴🇲", type: "major", country: "Oman", hubs: ["MCT"], regions: ["Middle East", "Asia", "Africa", "Europe"] },
  { code: "RJ", icao: "RJA", name: "Royal Jordanian", logo: "🇯🇴", type: "major", alliance: "oneworld", country: "Jordan", hubs: ["AMM"], regions: ["Middle East", "Europe", "North America", "Asia"] },
  { code: "LY", icao: "ELY", name: "El Al Israel Airlines", logo: "🇮🇱", type: "major", country: "Israel", hubs: ["TLV"], regions: ["Europe", "North America", "Asia"] },
  { code: "ME", icao: "MEA", name: "Middle East Airlines", logo: "🇱🇧", type: "major", alliance: "SkyTeam", country: "Lebanon", hubs: ["BEY"], regions: ["Middle East", "Europe", "Africa"] },
  
  // ===== ASIA =====
  // Japan
  { code: "JL", icao: "JAL", name: "Japan Airlines", logo: "🇯🇵", type: "major", alliance: "oneworld", country: "Japan", hubs: ["NRT", "HND"], regions: ["Asia", "North America", "Europe", "Oceania"] },
  { code: "NH", icao: "ANA", name: "All Nippon Airways", logo: "🇯🇵", type: "major", alliance: "Star Alliance", country: "Japan", hubs: ["NRT", "HND"], regions: ["Asia", "North America", "Europe", "Oceania"] },
  { code: "NU", icao: "JTA", name: "Japan Transocean Air", logo: "🌴", type: "regional", country: "Japan", hubs: ["OKA"], regions: ["Japan"] },
  
  // South Korea
  { code: "KE", icao: "KAL", name: "Korean Air", logo: "🇰🇷", type: "major", alliance: "SkyTeam", country: "South Korea", hubs: ["ICN"], regions: ["Asia", "North America", "Europe", "Oceania"] },
  { code: "OZ", icao: "AAR", name: "Asiana Airlines", logo: "🇰🇷", type: "major", alliance: "Star Alliance", country: "South Korea", hubs: ["ICN"], regions: ["Asia", "North America", "Europe", "Oceania"] },
  { code: "TW", icao: "TWB", name: "T'way Air", logo: "🔴", type: "low-cost", country: "South Korea", hubs: ["ICN"], regions: ["Asia"] },
  { code: "7C", icao: "JJA", name: "Jeju Air", logo: "🟠", type: "low-cost", country: "South Korea", hubs: ["ICN", "CJU"], regions: ["Asia"] },
  
  // China
  { code: "CA", icao: "CCA", name: "Air China", logo: "🇨🇳", type: "major", alliance: "Star Alliance", country: "China", hubs: ["PEK"], regions: ["Asia", "Europe", "North America", "Oceania", "Africa"] },
  { code: "MU", icao: "CES", name: "China Eastern Airlines", logo: "🇨🇳", type: "major", alliance: "SkyTeam", country: "China", hubs: ["PVG", "SHA"], regions: ["Asia", "Europe", "North America", "Oceania"] },
  { code: "CZ", icao: "CSN", name: "China Southern Airlines", logo: "🇨🇳", type: "major", alliance: "SkyTeam", country: "China", hubs: ["CAN", "PEK"], regions: ["Asia", "Europe", "North America", "Oceania", "Africa"] },
  { code: "HU", icao: "CHH", name: "Hainan Airlines", logo: "🦅", type: "major", country: "China", hubs: ["PEK", "HAK"], regions: ["Asia", "Europe", "North America", "Oceania"] },
  { code: "3U", icao: "CSC", name: "Sichuan Airlines", logo: "🐼", type: "major", country: "China", hubs: ["CTU", "CKG"], regions: ["Asia"] },
  { code: "ZH", icao: "CSZ", name: "Shenzhen Airlines", logo: "🌟", type: "major", alliance: "Star Alliance", country: "China", hubs: ["SZX"], regions: ["Asia"] },
  
  // Hong Kong & Taiwan
  { code: "CX", icao: "CPA", name: "Cathay Pacific", logo: "🇭🇰", type: "major", alliance: "oneworld", country: "Hong Kong", hubs: ["HKG"], regions: ["Asia", "Europe", "North America", "Oceania", "Africa"] },
  { code: "HX", icao: "CRK", name: "Hong Kong Airlines", logo: "🔴", type: "major", country: "Hong Kong", hubs: ["HKG"], regions: ["Asia"] },
  { code: "CI", icao: "CAL", name: "China Airlines", logo: "🇹🇼", type: "major", alliance: "SkyTeam", country: "Taiwan", hubs: ["TPE"], regions: ["Asia", "Europe", "North America", "Oceania"] },
  { code: "BR", icao: "EVA", name: "EVA Air", logo: "🇹🇼", type: "major", alliance: "Star Alliance", country: "Taiwan", hubs: ["TPE"], regions: ["Asia", "Europe", "North America", "Oceania"] },
  
  // Southeast Asia
  { code: "SQ", icao: "SIA", name: "Singapore Airlines", logo: "🇸🇬", type: "major", alliance: "Star Alliance", country: "Singapore", hubs: ["SIN"], regions: ["Asia", "Europe", "North America", "Oceania", "Africa"] },
  { code: "TR", icao: "TGW", name: "Scoot", logo: "💛", type: "low-cost", country: "Singapore", hubs: ["SIN"], regions: ["Asia", "Oceania"] },
  { code: "TG", icao: "THA", name: "Thai Airways", logo: "🇹🇭", type: "major", alliance: "Star Alliance", country: "Thailand", hubs: ["BKK"], regions: ["Asia", "Europe", "North America", "Oceania"] },
  { code: "FD", icao: "AIQ", name: "Thai AirAsia", logo: "🔴", type: "low-cost", country: "Thailand", hubs: ["DMK"], regions: ["Asia"] },
  { code: "MH", icao: "MAS", name: "Malaysia Airlines", logo: "🇲🇾", type: "major", alliance: "oneworld", country: "Malaysia", hubs: ["KUL"], regions: ["Asia", "Europe", "Oceania", "Middle East"] },
  { code: "AK", icao: "AXM", name: "AirAsia", logo: "🔴", type: "low-cost", country: "Malaysia", hubs: ["KUL"], regions: ["Asia", "Oceania"] },
  { code: "GA", icao: "GIA", name: "Garuda Indonesia", logo: "🇮🇩", type: "major", alliance: "SkyTeam", country: "Indonesia", hubs: ["CGK"], regions: ["Asia", "Oceania", "Middle East"] },
  { code: "ID", icao: "BTK", name: "Batik Air", logo: "🔴", type: "low-cost", country: "Indonesia", hubs: ["CGK"], regions: ["Asia"] },
  { code: "PR", icao: "PAL", name: "Philippine Airlines", logo: "🇵🇭", type: "major", country: "Philippines", hubs: ["MNL"], regions: ["Asia", "North America", "Middle East", "Oceania"] },
  { code: "5J", icao: "CEB", name: "Cebu Pacific", logo: "💛", type: "low-cost", country: "Philippines", hubs: ["MNL", "CEB"], regions: ["Asia", "Oceania", "Middle East"] },
  { code: "VN", icao: "HVN", name: "Vietnam Airlines", logo: "🇻🇳", type: "major", alliance: "SkyTeam", country: "Vietnam", hubs: ["SGN", "HAN"], regions: ["Asia", "Europe", "Oceania"] },
  { code: "VJ", icao: "VJC", name: "VietJet Air", logo: "🔴", type: "low-cost", country: "Vietnam", hubs: ["SGN", "HAN"], regions: ["Asia"] },
  
  // India
  { code: "AI", icao: "AIC", name: "Air India", logo: "🇮🇳", type: "major", alliance: "Star Alliance", country: "India", hubs: ["DEL", "BOM"], regions: ["Asia", "Europe", "North America", "Middle East", "Oceania"] },
  { code: "6E", icao: "IGO", name: "IndiGo", logo: "🔵", type: "low-cost", country: "India", hubs: ["DEL", "BLR", "BOM"], regions: ["Asia", "Middle East"] },
  { code: "G8", icao: "GOW", name: "GoAir", logo: "🟢", type: "low-cost", country: "India", hubs: ["DEL", "BOM"], regions: ["Asia", "Middle East"] },
  { code: "SG", icao: "SEJ", name: "SpiceJet", logo: "🔴", type: "low-cost", country: "India", hubs: ["DEL", "HYD"], regions: ["Asia", "Middle East"] },
  
  // ===== OCEANIA =====
  { code: "QF", icao: "QFA", name: "Qantas", logo: "🇦🇺", type: "major", alliance: "oneworld", country: "Australia", hubs: ["SYD", "MEL"], regions: ["Oceania", "Asia", "North America", "Europe", "Africa"] },
  { code: "VA", icao: "VOZ", name: "Virgin Australia", logo: "❤️", type: "major", country: "Australia", hubs: ["SYD", "MEL", "BNE"], regions: ["Oceania", "Asia"] },
  { code: "JQ", icao: "JST", name: "Jetstar Airways", logo: "🟠", type: "low-cost", country: "Australia", hubs: ["MEL", "SYD"], regions: ["Oceania", "Asia"] },
  { code: "NZ", icao: "ANZ", name: "Air New Zealand", logo: "🇳🇿", type: "major", alliance: "Star Alliance", country: "New Zealand", hubs: ["AKL"], regions: ["Oceania", "Asia", "North America"] },
  { code: "FJ", icao: "FJI", name: "Fiji Airways", logo: "🇫🇯", type: "major", alliance: "oneworld", country: "Fiji", hubs: ["NAN"], regions: ["Oceania", "Asia", "North America"] },
  
  // ===== AFRICA =====
  { code: "SA", icao: "SAA", name: "South African Airways", logo: "🇿🇦", type: "major", alliance: "Star Alliance", country: "South Africa", hubs: ["JNB"], regions: ["Africa", "Europe", "Asia", "North America"] },
  { code: "ET", icao: "ETH", name: "Ethiopian Airlines", logo: "🇪🇹", type: "major", alliance: "Star Alliance", country: "Ethiopia", hubs: ["ADD"], regions: ["Africa", "Europe", "Asia", "North America", "South America"] },
  { code: "MS", icao: "MSR", name: "EgyptAir", logo: "🇪🇬", type: "major", alliance: "Star Alliance", country: "Egypt", hubs: ["CAI"], regions: ["Africa", "Europe", "Asia", "North America"] },
  { code: "AT", icao: "RAM", name: "Royal Air Maroc", logo: "🇲🇦", type: "major", alliance: "oneworld", country: "Morocco", hubs: ["CMN"], regions: ["Africa", "Europe", "Middle East", "North America"] },
  { code: "KQ", icao: "KQA", name: "Kenya Airways", logo: "🇰🇪", type: "major", alliance: "SkyTeam", country: "Kenya", hubs: ["NBO"], regions: ["Africa", "Europe", "Asia"] },
  { code: "MK", icao: "MAU", name: "Air Mauritius", logo: "🇲🇺", type: "major", country: "Mauritius", hubs: ["MRU"], regions: ["Africa", "Asia", "Europe"] },
  
  // ===== LATIN AMERICA =====
  { code: "AM", icao: "AMX", name: "Aeroméxico", logo: "🇲🇽", type: "major", alliance: "SkyTeam", country: "Mexico", hubs: ["MEX", "GDL"], regions: ["North America", "Latin America", "Europe", "Asia"] },
  { code: "4O", icao: "VOI", name: "Volaris", logo: "🟣", type: "ultra-low-cost", country: "Mexico", hubs: ["MEX", "TIJ", "GDL"], regions: ["North America", "Central America"] },
  { code: "Y4", icao: "VOE", name: "VivaAerobus", logo: "🟢", type: "ultra-low-cost", country: "Mexico", hubs: ["MTY", "MEX", "GDL"], regions: ["North America", "Central America"] },
  { code: "AV", icao: "AVA", name: "Avianca", logo: "🇨🇴", type: "major", alliance: "Star Alliance", country: "Colombia", hubs: ["BOG"], regions: ["Latin America", "North America", "Europe"] },
  { code: "LA", icao: "LAN", name: "LATAM Airlines", logo: "🇨🇱", type: "major", country: "Chile", hubs: ["SCL", "GRU", "LIM"], regions: ["Latin America", "North America", "Europe", "Oceania"] },
  { code: "G3", icao: "GLO", name: "Gol Linhas Aéreas", logo: "🟠", type: "low-cost", country: "Brazil", hubs: ["GRU", "GIG", "BSB"], regions: ["Latin America", "North America"] },
  { code: "AD", icao: "AZU", name: "Azul Brazilian Airlines", logo: "🔵", type: "low-cost", country: "Brazil", hubs: ["VCP", "CNF"], regions: ["Latin America", "North America", "Europe"] },
  { code: "CM", icao: "CMP", name: "Copa Airlines", logo: "🇵🇦", type: "major", alliance: "Star Alliance", country: "Panama", hubs: ["PTY"], regions: ["Latin America", "North America", "Caribbean"] },
  { code: "AR", icao: "ARG", name: "Aerolíneas Argentinas", logo: "🇦🇷", type: "major", alliance: "SkyTeam", country: "Argentina", hubs: ["EZE", "AEP"], regions: ["Latin America", "North America", "Europe"] },
  
  // ===== CANADA =====
  { code: "AC", icao: "ACA", name: "Air Canada", logo: "🇨🇦", type: "major", alliance: "Star Alliance", country: "Canada", hubs: ["YYZ", "YVR", "YUL"], regions: ["North America", "Europe", "Asia", "Latin America", "Caribbean", "Oceania"] },
  { code: "WS", icao: "WJA", name: "WestJet", logo: "🇨🇦", type: "low-cost", country: "Canada", hubs: ["YYC", "YYZ", "YVR"], regions: ["North America", "Caribbean", "Europe"] },
  { code: "PD", icao: "POE", name: "Porter Airlines", logo: "🦌", type: "regional", country: "Canada", hubs: ["YTZ", "YOW"], regions: ["North America"] },
  { code: "TS", icao: "TSC", name: "Air Transat", logo: "⭐", type: "low-cost", country: "Canada", hubs: ["YUL", "YYZ"], regions: ["North America", "Europe", "Caribbean"] },
];

// Get airlines that operate at a specific airport
export function getAirlinesAtAirport(airportCode: string): Airline[] {
  return AIRLINES.filter(airline => 
    airline.hubs.includes(airportCode) ||
    // Also include major carriers that likely serve this airport
    (airline.type === "major" && airline.regions.some(r => 
      (["ATL", "ORD", "LAX", "DFW", "DEN", "JFK", "SFO", "SEA", "LAS", "MCO", "MIA"].includes(airportCode) && r === "North America") ||
      (["LHR", "CDG", "FRA", "AMS", "MAD"].includes(airportCode) && r === "Europe") ||
      (["NRT", "HND", "ICN", "PEK", "SIN", "HKG", "BKK"].includes(airportCode) && r === "Asia")
    ))
  );
}

// Get airlines by region
export function getAirlinesByRegion(region: string): Airline[] {
  return AIRLINES.filter(airline => airline.regions.includes(region));
}

// Get airlines for a route (basic intelligence)
export function getAirlinesForRoute(originCode: string, destinationCode: string): Airline[] {
  const originAirlines = getAirlinesAtAirport(originCode);
  const destAirlines = getAirlinesAtAirport(destinationCode);
  
  // Find airlines that might serve both
  const routeAirlines = AIRLINES.filter(airline => {
    // Check if airline hubs at either airport
    if (airline.hubs.includes(originCode) || airline.hubs.includes(destinationCode)) {
      return true;
    }
    
    // Check regional coverage overlap
    return airline.regions.length > 1; // Multi-region carriers
  });
  
  return routeAirlines;
}

// Get low-cost carriers
export function getLowCostCarriers(): Airline[] {
  return AIRLINES.filter(a => a.type === "low-cost" || a.type === "ultra-low-cost");
}

// Get major carriers
export function getMajorCarriers(): Airline[] {
  return AIRLINES.filter(a => a.type === "major");
}

// Get alliance members
export function getAllianceMembers(alliance: "Star Alliance" | "oneworld" | "SkyTeam"): Airline[] {
  return AIRLINES.filter(a => a.alliance === alliance);
}
