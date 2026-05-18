// Comprehensive Global Airport Database
// Includes IATA codes, cities, countries, regions, and metro area groupings

export interface Airport {
  code: string;
  icao?: string;
  city: string;
  name: string;
  country: string;
  region?: string;
  state?: string;
  metroArea?: string;
  aliases?: string[];
  timezone?: string;
}

// Metro area airport groupings
export const METRO_AREAS: Record<string, string[]> = {
  "New York": ["JFK", "LGA", "EWR", "HPN", "ISP"],
  "Los Angeles": ["LAX", "BUR", "SNA", "ONT", "LGB"],
  "Chicago": ["ORD", "MDW", "RFD"],
  "San Francisco Bay Area": ["SFO", "OAK", "SJC"],
  "Washington D.C.": ["DCA", "IAD", "BWI"],
  "London": ["LHR", "LGW", "STN", "LTN", "LCY"],
  "Paris": ["CDG", "ORY", "BVA"],
  "Tokyo": ["NRT", "HND"],
  "Shanghai": ["PVG", "SHA"],
  "Seoul": ["ICN", "GMP"],
  "Miami": ["MIA", "FLL", "PBI"],
  "Dallas": ["DFW", "DAL", "AFW"],
  "Houston": ["IAH", "HOU"],
  "Toronto": ["YYZ", "YTZ", "YHM"],
  "Milan": ["MXP", "LIN", "BGY"],
  "Rome": ["FCO", "CIA"],
  "Moscow": ["SVO", "DME", "VKO"],
  "Beijing": ["PEK", "PKX"],
  "Bangkok": ["BKK", "DMK"],
};

// US State mappings (full name, abbreviation, and nicknames)
export const US_STATES: Record<string, { abbrev: string; capital: string; majorAirports: string[] }> = {
  "Alabama": { abbrev: "AL", capital: "Montgomery", majorAirports: ["BHM", "HSV", "MOB"] },
  "Alaska": { abbrev: "AK", capital: "Juneau", majorAirports: ["ANC", "FAI", "JNU"] },
  "Arizona": { abbrev: "AZ", capital: "Phoenix", majorAirports: ["PHX", "TUS", "AZA"] },
  "Arkansas": { abbrev: "AR", capital: "Little Rock", majorAirports: ["LIT", "XNA"] },
  "California": { abbrev: "CA", capital: "Sacramento", majorAirports: ["LAX", "SFO", "SAN", "SJC", "OAK", "SMF", "ONT", "BUR", "SNA", "LGB"] },
  "Colorado": { abbrev: "CO", capital: "Denver", majorAirports: ["DEN", "COS", "HDN"] },
  "Connecticut": { abbrev: "CT", capital: "Hartford", majorAirports: ["BDL", "HVN"] },
  "Delaware": { abbrev: "DE", capital: "Dover", majorAirports: ["ILG", "PHL"] },
  "Florida": { abbrev: "FL", capital: "Tallahassee", majorAirports: ["MIA", "MCO", "FLL", "TPA", "JAX", "PBI", "RSW", "SRQ"] },
  "Georgia": { abbrev: "GA", capital: "Atlanta", majorAirports: ["ATL", "SAV", "AGS"] },
  "Hawaii": { abbrev: "HI", capital: "Honolulu", majorAirports: ["HNL", "OGG", "KOA", "LIH"] },
  "Idaho": { abbrev: "ID", capital: "Boise", majorAirports: ["BOI", "SUN"] },
  "Illinois": { abbrev: "IL", capital: "Springfield", majorAirports: ["ORD", "MDW", "SPI", "BMI"] },
  "Indiana": { abbrev: "IN", capital: "Indianapolis", majorAirports: ["IND", "SBN", "FWA"] },
  "Iowa": { abbrev: "IA", capital: "Des Moines", majorAirports: ["DSM", "CID"] },
  "Kansas": { abbrev: "KS", capital: "Topeka", majorAirports: ["MCI", "ICT"] },
  "Kentucky": { abbrev: "KY", capital: "Frankfort", majorAirports: ["SDF", "CVG", "LEX"] },
  "Louisiana": { abbrev: "LA", capital: "Baton Rouge", majorAirports: ["MSY", "BTR", "SHV"] },
  "Maine": { abbrev: "ME", capital: "Augusta", majorAirports: ["PWM", "BGR"] },
  "Maryland": { abbrev: "MD", capital: "Annapolis", majorAirports: ["BWI"] },
  "Massachusetts": { abbrev: "MA", capital: "Boston", majorAirports: ["BOS", "ORH", "PVC"] },
  "Michigan": { abbrev: "MI", capital: "Lansing", majorAirports: ["DTW", "GRR", "LAN", "FNT"] },
  "Minnesota": { abbrev: "MN", capital: "St. Paul", majorAirports: ["MSP", "RST", "DLH"] },
  "Mississippi": { abbrev: "MS", capital: "Jackson", majorAirports: ["JAN", "GPT"] },
  "Missouri": { abbrev: "MO", capital: "Jefferson City", majorAirports: ["MCI", "STL", "SGF"] },
  "Montana": { abbrev: "MT", capital: "Helena", majorAirports: ["BZN", "MSO", "BIL"] },
  "Nebraska": { abbrev: "NE", capital: "Lincoln", majorAirports: ["OMA", "LNK"] },
  "Nevada": { abbrev: "NV", capital: "Carson City", majorAirports: ["LAS", "RNO"] },
  "New Hampshire": { abbrev: "NH", capital: "Concord", majorAirports: ["MHT", "PSM"] },
  "New Jersey": { abbrev: "NJ", capital: "Trenton", majorAirports: ["EWR", "ACY", "TTN"] },
  "New Mexico": { abbrev: "NM", capital: "Santa Fe", majorAirports: ["ABQ", "SAF"] },
  "New York": { abbrev: "NY", capital: "Albany", majorAirports: ["JFK", "LGA", "EWR", "BUF", "ROC", "SYR", "ALB", "ISP"] },
  "North Carolina": { abbrev: "NC", capital: "Raleigh", majorAirports: ["CLT", "RDU", "GSO"] },
  "North Dakota": { abbrev: "ND", capital: "Bismarck", majorAirports: ["FAR", "BIS"] },
  "Ohio": { abbrev: "OH", capital: "Columbus", majorAirports: ["CLE", "CMH", "CVG", "DAY"] },
  "Oklahoma": { abbrev: "OK", capital: "Oklahoma City", majorAirports: ["OKC", "TUL"] },
  "Oregon": { abbrev: "OR", capital: "Salem", majorAirports: ["PDX", "EUG", "MFR"] },
  "Pennsylvania": { abbrev: "PA", capital: "Harrisburg", majorAirports: ["PHL", "PIT", "ABE", "MDT"] },
  "Rhode Island": { abbrev: "RI", capital: "Providence", majorAirports: ["PVD"] },
  "South Carolina": { abbrev: "SC", capital: "Columbia", majorAirports: ["CHS", "CAE", "MYR", "GSP"] },
  "South Dakota": { abbrev: "SD", capital: "Pierre", majorAirports: ["RAP", "FSD"] },
  "Tennessee": { abbrev: "TN", capital: "Nashville", majorAirports: ["BNA", "MEM", "TYS"] },
  "Texas": { abbrev: "TX", capital: "Austin", majorAirports: ["DFW", "IAH", "AUS", "SAT", "DAL", "HOU", "ELP"] },
  "Utah": { abbrev: "UT", capital: "Salt Lake City", majorAirports: ["SLC"] },
  "Vermont": { abbrev: "VT", capital: "Montpelier", majorAirports: ["BTV"] },
  "Virginia": { abbrev: "VA", capital: "Richmond", majorAirports: ["DCA", "IAD", "RIC", "ORF", "PHF"] },
  "Washington": { abbrev: "WA", capital: "Olympia", majorAirports: ["SEA", "GEG", "BLI"] },
  "West Virginia": { abbrev: "WV", capital: "Charleston", majorAirports: ["CRW", "CKB"] },
  "Wisconsin": { abbrev: "WI", capital: "Madison", majorAirports: ["MKE", "MSN", "GRB"] },
  "Wyoming": { abbrev: "WY", capital: "Cheyenne", majorAirports: ["JAC", "CYS", "COD"] },
};

// Comprehensive global airport database
export const AIRPORTS: Airport[] = [
  // ===== UNITED STATES =====
  // Major Hubs
  { code: "ATL", icao: "KATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International", country: "USA", state: "Georgia", metroArea: "Atlanta" },
  { code: "LAX", icao: "KLAX", city: "Los Angeles", name: "Los Angeles International", country: "USA", state: "California", metroArea: "Los Angeles", aliases: ["LA"] },
  { code: "ORD", icao: "KORD", city: "Chicago", name: "O'Hare International", country: "USA", state: "Illinois", metroArea: "Chicago" },
  { code: "DFW", icao: "KDFW", city: "Dallas", name: "Dallas/Fort Worth International", country: "USA", state: "Texas", metroArea: "Dallas" },
  { code: "DEN", icao: "KDEN", city: "Denver", name: "Denver International", country: "USA", state: "Colorado" },
  { code: "JFK", icao: "KJFK", city: "New York", name: "John F. Kennedy International", country: "USA", state: "New York", metroArea: "New York", aliases: ["NYC", "New York City"] },
  { code: "SFO", icao: "KSFO", city: "San Francisco", name: "San Francisco International", country: "USA", state: "California", metroArea: "San Francisco Bay Area", aliases: ["SF", "Bay Area"] },
  { code: "SEA", icao: "KSEA", city: "Seattle", name: "Seattle-Tacoma International", country: "USA", state: "Washington", aliases: ["SeaTac"] },
  { code: "LAS", icao: "KLAS", city: "Las Vegas", name: "Harry Reid International", country: "USA", state: "Nevada", aliases: ["Vegas"] },
  { code: "MCO", icao: "KMCO", city: "Orlando", name: "Orlando International", country: "USA", state: "Florida" },
  { code: "EWR", icao: "KEWR", city: "Newark", name: "Newark Liberty International", country: "USA", state: "New Jersey", metroArea: "New York" },
  { code: "MIA", icao: "KMIA", city: "Miami", name: "Miami International", country: "USA", state: "Florida", metroArea: "Miami" },
  { code: "PHX", icao: "KPHX", city: "Phoenix", name: "Phoenix Sky Harbor International", country: "USA", state: "Arizona" },
  { code: "IAH", icao: "KIAH", city: "Houston", name: "George Bush Intercontinental", country: "USA", state: "Texas", metroArea: "Houston" },
  { code: "BOS", icao: "KBOS", city: "Boston", name: "Logan International", country: "USA", state: "Massachusetts" },
  { code: "MSP", icao: "KMSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International", country: "USA", state: "Minnesota", aliases: ["Twin Cities"] },
  { code: "DTW", icao: "KDTW", city: "Detroit", name: "Detroit Metropolitan", country: "USA", state: "Michigan" },
  { code: "PHL", icao: "KPHL", city: "Philadelphia", name: "Philadelphia International", country: "USA", state: "Pennsylvania", aliases: ["Philly"] },
  { code: "LGA", icao: "KLGA", city: "New York", name: "LaGuardia", country: "USA", state: "New York", metroArea: "New York" },
  { code: "BWI", icao: "KBWI", city: "Baltimore", name: "Baltimore/Washington International", country: "USA", state: "Maryland", metroArea: "Washington D.C." },
  { code: "SLC", icao: "KSLC", city: "Salt Lake City", name: "Salt Lake City International", country: "USA", state: "Utah" },
  { code: "DCA", icao: "KDCA", city: "Washington D.C.", name: "Ronald Reagan Washington National", country: "USA", metroArea: "Washington D.C.", aliases: ["Reagan", "National"] },
  { code: "IAD", icao: "KIAD", city: "Washington D.C.", name: "Washington Dulles International", country: "USA", metroArea: "Washington D.C.", aliases: ["Dulles"] },
  { code: "SAN", icao: "KSAN", city: "San Diego", name: "San Diego International", country: "USA", state: "California" },
  { code: "TPA", icao: "KTPA", city: "Tampa", name: "Tampa International", country: "USA", state: "Florida" },
  { code: "AUS", icao: "KAUS", city: "Austin", name: "Austin-Bergstrom International", country: "USA", state: "Texas" },
  { code: "PDX", icao: "KPDX", city: "Portland", name: "Portland International", country: "USA", state: "Oregon", aliases: ["PDX"] },
  { code: "HNL", icao: "PHNL", city: "Honolulu", name: "Daniel K. Inouye International", country: "USA", state: "Hawaii" },
  { code: "DAL", icao: "KDAL", city: "Dallas", name: "Dallas Love Field", country: "USA", state: "Texas", metroArea: "Dallas" },
  { code: "MDW", icao: "KMDW", city: "Chicago", name: "Chicago Midway International", country: "USA", state: "Illinois", metroArea: "Chicago" },
  { code: "FLL", icao: "KFLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International", country: "USA", state: "Florida", metroArea: "Miami" },
  { code: "CLT", icao: "KCLT", city: "Charlotte", name: "Charlotte Douglas International", country: "USA", state: "North Carolina" },
  { code: "RDU", icao: "KRDU", city: "Raleigh", name: "Raleigh-Durham International", country: "USA", state: "North Carolina", aliases: ["Research Triangle"] },
  { code: "BNA", icao: "KBNA", city: "Nashville", name: "Nashville International", country: "USA", state: "Tennessee" },
  { code: "MEM", icao: "KMEM", city: "Memphis", name: "Memphis International", country: "USA", state: "Tennessee" },
  { code: "STL", icao: "KSTL", city: "St. Louis", name: "St. Louis Lambert International", country: "USA", state: "Missouri" },
  { code: "CLE", icao: "KCLE", city: "Cleveland", name: "Cleveland Hopkins International", country: "USA", state: "Ohio" },
  { code: "CMH", icao: "KCMH", city: "Columbus", name: "John Glenn Columbus International", country: "USA", state: "Ohio" },
  { code: "IND", icao: "KIND", city: "Indianapolis", name: "Indianapolis International", country: "USA", state: "Indiana" },
  { code: "PIT", icao: "KPIT", city: "Pittsburgh", name: "Pittsburgh International", country: "USA", state: "Pennsylvania" },
  { code: "SAT", icao: "KSAT", city: "San Antonio", name: "San Antonio International", country: "USA", state: "Texas" },
  { code: "MKE", icao: "KMKE", city: "Milwaukee", name: "General Mitchell International", country: "USA", state: "Wisconsin" },
  { code: "MSY", icao: "KMSY", city: "New Orleans", name: "Louis Armstrong New Orleans International", country: "USA", state: "Louisiana", aliases: ["NOLA"] },
  { code: "JAX", icao: "KJAX", city: "Jacksonville", name: "Jacksonville International", country: "USA", state: "Florida" },
  { code: "OAK", icao: "KOAK", city: "Oakland", name: "Oakland International", country: "USA", state: "California", metroArea: "San Francisco Bay Area" },
  { code: "SJC", icao: "KSJC", city: "San Jose", name: "Norman Y. Mineta San Jose International", country: "USA", state: "California", metroArea: "San Francisco Bay Area", aliases: ["Silicon Valley"] },
  { code: "SMF", icao: "KSMF", city: "Sacramento", name: "Sacramento International", country: "USA", state: "California" },
  { code: "BUR", icao: "KBUR", city: "Burbank", name: "Hollywood Burbank", country: "USA", state: "California", metroArea: "Los Angeles" },
  { code: "SNA", icao: "KSNA", city: "Santa Ana", name: "John Wayne Airport", country: "USA", state: "California", metroArea: "Los Angeles", aliases: ["Orange County"] },
  { code: "ONT", icao: "KONT", city: "Ontario", name: "Ontario International", country: "USA", state: "California", metroArea: "Los Angeles" },
  { code: "OGG", icao: "PHOG", city: "Kahului", name: "Kahului Airport", country: "USA", state: "Hawaii", aliases: ["Maui"] },
  { code: "KOA", icao: "PHKO", city: "Kailua-Kona", name: "Ellison Onizuka Kona International", country: "USA", state: "Hawaii", aliases: ["Big Island", "Kona"] },
  { code: "LIH", icao: "PHLI", city: "Lihue", name: "Lihue Airport", country: "USA", state: "Hawaii", aliases: ["Kauai"] },
  { code: "ANC", icao: "PANC", city: "Anchorage", name: "Ted Stevens Anchorage International", country: "USA", state: "Alaska" },
  { code: "FAI", icao: "PAFA", city: "Fairbanks", name: "Fairbanks International", country: "USA", state: "Alaska" },
  { code: "JNU", icao: "PAJN", city: "Juneau", name: "Juneau International", country: "USA", state: "Alaska" },
  { code: "ABQ", icao: "KABQ", city: "Albuquerque", name: "Albuquerque International Sunport", country: "USA", state: "New Mexico" },
  { code: "GEG", icao: "KGEG", city: "Spokane", name: "Spokane International", country: "USA", state: "Washington" },
  { code: "BOI", icao: "KBOI", city: "Boise", name: "Boise Airport", country: "USA", state: "Idaho" },
  { code: "OKC", icao: "KOKC", city: "Oklahoma City", name: "Will Rogers World Airport", country: "USA", state: "Oklahoma" },
  { code: "TUL", icao: "KTUL", city: "Tulsa", name: "Tulsa International", country: "USA", state: "Oklahoma" },
  { code: "OMA", icao: "KOMA", city: "Omaha", name: "Eppley Airfield", country: "USA", state: "Nebraska" },
  { code: "ICT", icao: "KICT", city: "Wichita", name: "Dwight D. Eisenhower National", country: "USA", state: "Kansas" },
  { code: "ELP", icao: "KELP", city: "El Paso", name: "El Paso International", country: "USA", state: "Texas" },
  { code: "TUS", icao: "KTUS", city: "Tucson", name: "Tucson International", country: "USA", state: "Arizona" },
  { code: "RNO", icao: "KRNO", city: "Reno", name: "Reno-Tahoe International", country: "USA", state: "Nevada" },
  { code: "PBI", icao: "KPBI", city: "West Palm Beach", name: "Palm Beach International", country: "USA", state: "Florida", metroArea: "Miami" },
  { code: "RSW", icao: "KRSW", city: "Fort Myers", name: "Southwest Florida International", country: "USA", state: "Florida" },
  { code: "GUM", icao: "PGUM", city: "Hagåtña", name: "Antonio B. Won Pat International", country: "USA", region: "Guam", aliases: ["Guam"] },
  
  // ===== EUROPE =====
  // United Kingdom
  { code: "LHR", icao: "EGLL", city: "London", name: "Heathrow", country: "UK", metroArea: "London" },
  { code: "LGW", icao: "EGKK", city: "London", name: "Gatwick", country: "UK", metroArea: "London" },
  { code: "STN", icao: "EGSS", city: "London", name: "Stansted", country: "UK", metroArea: "London" },
  { code: "LTN", icao: "EGGW", city: "London", name: "Luton", country: "UK", metroArea: "London" },
  { code: "LCY", icao: "EGLC", city: "London", name: "London City", country: "UK", metroArea: "London" },
  { code: "MAN", icao: "EGCC", city: "Manchester", name: "Manchester", country: "UK" },
  { code: "BHX", icao: "EGBB", city: "Birmingham", name: "Birmingham", country: "UK" },
  { code: "EDI", icao: "EGPH", city: "Edinburgh", name: "Edinburgh", country: "UK", region: "Scotland" },
  { code: "GLA", icao: "EGPF", city: "Glasgow", name: "Glasgow", country: "UK", region: "Scotland" },
  { code: "BRS", icao: "EGGD", city: "Bristol", name: "Bristol", country: "UK" },
  
  // France
  { code: "CDG", icao: "LFPG", city: "Paris", name: "Charles de Gaulle", country: "France", metroArea: "Paris" },
  { code: "ORY", icao: "LFPO", city: "Paris", name: "Orly", country: "France", metroArea: "Paris" },
  { code: "NCE", icao: "LFMN", city: "Nice", name: "Nice Côte d'Azur", country: "France" },
  { code: "LYS", icao: "LFLL", city: "Lyon", name: "Lyon–Saint-Exupéry", country: "France" },
  { code: "MRS", icao: "LFML", city: "Marseille", name: "Marseille Provence", country: "France" },
  { code: "TLS", icao: "LFBO", city: "Toulouse", name: "Toulouse-Blagnac", country: "France" },
  
  // Germany
  { code: "FRA", icao: "EDDF", city: "Frankfurt", name: "Frankfurt am Main", country: "Germany" },
  { code: "MUC", icao: "EDDM", city: "Munich", name: "Munich International", country: "Germany", aliases: ["München"] },
  { code: "BER", icao: "EDDB", city: "Berlin", name: "Berlin Brandenburg", country: "Germany" },
  { code: "DUS", icao: "EDDL", city: "Düsseldorf", name: "Düsseldorf", country: "Germany" },
  { code: "HAM", icao: "EDDH", city: "Hamburg", name: "Hamburg", country: "Germany" },
  { code: "CGN", icao: "EDDK", city: "Cologne", name: "Cologne Bonn", country: "Germany", aliases: ["Köln"] },
  { code: "STR", icao: "EDDS", city: "Stuttgart", name: "Stuttgart", country: "Germany" },
  
  // Spain
  { code: "MAD", icao: "LEMD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas", country: "Spain" },
  { code: "BCN", icao: "LEBL", city: "Barcelona", name: "Josep Tarradellas Barcelona–El Prat", country: "Spain" },
  { code: "PMI", icao: "LEPA", city: "Palma de Mallorca", name: "Palma de Mallorca", country: "Spain", aliases: ["Mallorca"] },
  { code: "AGP", icao: "LEMG", city: "Málaga", name: "Málaga-Costa del Sol", country: "Spain" },
  { code: "ALC", icao: "LEAL", city: "Alicante", name: "Alicante-Elche Miguel Hernández", country: "Spain" },
  { code: "IBZ", icao: "LEIB", city: "Ibiza", name: "Ibiza", country: "Spain" },
  
  // Italy
  { code: "FCO", icao: "LIRF", city: "Rome", name: "Leonardo da Vinci–Fiumicino", country: "Italy", metroArea: "Rome" },
  { code: "MXP", icao: "LIMC", city: "Milan", name: "Malpensa", country: "Italy", metroArea: "Milan" },
  { code: "LIN", icao: "LIML", city: "Milan", name: "Linate", country: "Italy", metroArea: "Milan" },
  { code: "VCE", icao: "LIPZ", city: "Venice", name: "Marco Polo", country: "Italy" },
  { code: "NAP", icao: "LIRN", city: "Naples", name: "Naples International", country: "Italy" },
  { code: "FLR", icao: "LIRQ", city: "Florence", name: "Amerigo Vespucci", country: "Italy" },
  { code: "BGY", icao: "LIME", city: "Bergamo", name: "Il Caravaggio", country: "Italy", metroArea: "Milan" },
  
  // Netherlands
  { code: "AMS", icao: "EHAM", city: "Amsterdam", name: "Schiphol", country: "Netherlands" },
  { code: "RTM", icao: "EHRD", city: "Rotterdam", name: "Rotterdam The Hague", country: "Netherlands" },
  { code: "EIN", icao: "EHEH", city: "Eindhoven", name: "Eindhoven", country: "Netherlands" },
  
  // Belgium
  { code: "BRU", icao: "EBBR", city: "Brussels", name: "Brussels", country: "Belgium" },
  { code: "CRL", icao: "EBCI", city: "Charleroi", name: "Brussels South Charleroi", country: "Belgium" },
  
  // Switzerland
  { code: "ZRH", icao: "LSZH", city: "Zurich", name: "Zurich", country: "Switzerland" },
  { code: "GVA", icao: "LSGG", city: "Geneva", name: "Geneva", country: "Switzerland" },
  { code: "BSL", icao: "LFSB", city: "Basel", name: "EuroAirport Basel-Mulhouse-Freiburg", country: "Switzerland" },
  
  // Austria
  { code: "VIE", icao: "LOWW", city: "Vienna", name: "Vienna International", country: "Austria" },
  { code: "SZG", icao: "LOWS", city: "Salzburg", name: "Salzburg", country: "Austria" },
  { code: "INN", icao: "LOWI", city: "Innsbruck", name: "Innsbruck", country: "Austria" },
  
  // Scandinavia
  { code: "CPH", icao: "EKCH", city: "Copenhagen", name: "Copenhagen", country: "Denmark" },
  { code: "ARN", icao: "ESSA", city: "Stockholm", name: "Stockholm Arlanda", country: "Sweden" },
  { code: "OSL", icao: "ENGM", city: "Oslo", name: "Oslo Gardermoen", country: "Norway" },
  { code: "HEL", icao: "EFHK", city: "Helsinki", name: "Helsinki-Vantaa", country: "Finland" },
  { code: "GOT", icao: "ESGG", city: "Gothenburg", name: "Göteborg Landvetter", country: "Sweden" },
  { code: "BGO", icao: "ENBR", city: "Bergen", name: "Bergen Flesland", country: "Norway" },
  { code: "TRD", icao: "ENVA", city: "Trondheim", name: "Trondheim Værnes", country: "Norway" },
  { code: "KEF", icao: "BIKF", city: "Reykjavik", name: "Keflavik International", country: "Iceland" },
  
  // Portugal
  { code: "LIS", icao: "LPPT", city: "Lisbon", name: "Humberto Delgado", country: "Portugal" },
  { code: "OPO", icao: "LPPR", city: "Porto", name: "Francisco Sá Carneiro", country: "Portugal" },
  { code: "FAO", icao: "LPFR", city: "Faro", name: "Faro", country: "Portugal", aliases: ["Algarve"] },
  
  // Ireland
  { code: "DUB", icao: "EIDW", city: "Dublin", name: "Dublin", country: "Ireland" },
  { code: "SNN", icao: "EINN", city: "Shannon", name: "Shannon", country: "Ireland" },
  { code: "ORK", icao: "EICK", city: "Cork", name: "Cork", country: "Ireland" },
  
  // Greece
  { code: "ATH", icao: "LGAV", city: "Athens", name: "Eleftherios Venizelos", country: "Greece" },
  { code: "SKG", icao: "LGTS", city: "Thessaloniki", name: "Makedonia", country: "Greece" },
  { code: "HER", icao: "LGIR", city: "Heraklion", name: "Heraklion International", country: "Greece", aliases: ["Crete"] },
  { code: "JMK", icao: "LGMK", city: "Mykonos", name: "Mykonos Island National", country: "Greece" },
  { code: "JTR", icao: "LGSR", city: "Santorini", name: "Santorini", country: "Greece" },
  
  // Turkey
  { code: "IST", icao: "LTFM", city: "Istanbul", name: "Istanbul", country: "Turkey" },
  { code: "SAW", icao: "LTFJ", city: "Istanbul", name: "Sabiha Gökçen", country: "Turkey" },
  { code: "AYT", icao: "LTAI", city: "Antalya", name: "Antalya", country: "Turkey" },
  { code: "ADB", icao: "LTBJ", city: "Izmir", name: "Adnan Menderes", country: "Turkey" },
  { code: "ESB", icao: "LTAC", city: "Ankara", name: "Esenboğa", country: "Turkey" },
  
  // Eastern Europe
  { code: "WAW", icao: "EPWA", city: "Warsaw", name: "Chopin", country: "Poland" },
  { code: "KRK", icao: "EPKK", city: "Kraków", name: "John Paul II", country: "Poland" },
  { code: "PRG", icao: "LKPR", city: "Prague", name: "Václav Havel", country: "Czech Republic" },
  { code: "BUD", icao: "LHBP", city: "Budapest", name: "Ferenc Liszt", country: "Hungary" },
  { code: "OTP", icao: "LROP", city: "Bucharest", name: "Henri Coandă", country: "Romania" },
  { code: "SOF", icao: "LBSF", city: "Sofia", name: "Sofia", country: "Bulgaria" },
  
  // Russia
  { code: "SVO", icao: "UUEE", city: "Moscow", name: "Sheremetyevo", country: "Russia", metroArea: "Moscow" },
  { code: "DME", icao: "UUDD", city: "Moscow", name: "Domodedovo", country: "Russia", metroArea: "Moscow" },
  { code: "VKO", icao: "UUWW", city: "Moscow", name: "Vnukovo", country: "Russia", metroArea: "Moscow" },
  { code: "LED", icao: "ULLI", city: "St. Petersburg", name: "Pulkovo", country: "Russia" },
  
  // ===== ASIA =====
  // Japan
  { code: "NRT", icao: "RJAA", city: "Tokyo", name: "Narita International", country: "Japan", metroArea: "Tokyo" },
  { code: "HND", icao: "RJTT", city: "Tokyo", name: "Haneda", country: "Japan", metroArea: "Tokyo" },
  { code: "KIX", icao: "RJBB", city: "Osaka", name: "Kansai International", country: "Japan" },
  { code: "ITM", icao: "RJOO", city: "Osaka", name: "Itami", country: "Japan" },
  { code: "NGO", icao: "RJGG", city: "Nagoya", name: "Chubu Centrair", country: "Japan" },
  { code: "FUK", icao: "RJFF", city: "Fukuoka", name: "Fukuoka", country: "Japan" },
  { code: "CTS", icao: "RJCC", city: "Sapporo", name: "New Chitose", country: "Japan", aliases: ["Hokkaido"] },
  { code: "OKA", icao: "ROAH", city: "Naha", name: "Naha", country: "Japan", aliases: ["Okinawa"] },
  
  // South Korea
  { code: "ICN", icao: "RKSI", city: "Seoul", name: "Incheon International", country: "South Korea", metroArea: "Seoul" },
  { code: "GMP", icao: "RKSS", city: "Seoul", name: "Gimpo", country: "South Korea", metroArea: "Seoul" },
  { code: "PUS", icao: "RKPK", city: "Busan", name: "Gimhae", country: "South Korea" },
  { code: "CJU", icao: "RKPC", city: "Jeju", name: "Jeju International", country: "South Korea" },
  
  // China
  { code: "PEK", icao: "ZBAA", city: "Beijing", name: "Beijing Capital International", country: "China", metroArea: "Beijing" },
  { code: "PKX", icao: "ZBAD", city: "Beijing", name: "Beijing Daxing", country: "China", metroArea: "Beijing" },
  { code: "PVG", icao: "ZSPD", city: "Shanghai", name: "Shanghai Pudong International", country: "China", metroArea: "Shanghai" },
  { code: "SHA", icao: "ZSSS", city: "Shanghai", name: "Shanghai Hongqiao", country: "China", metroArea: "Shanghai" },
  { code: "CAN", icao: "ZGGG", city: "Guangzhou", name: "Baiyun", country: "China" },
  { code: "SZX", icao: "ZGSZ", city: "Shenzhen", name: "Bao'an", country: "China" },
  { code: "CTU", icao: "ZUUU", city: "Chengdu", name: "Shuangliu", country: "China" },
  { code: "XIY", icao: "ZLXY", city: "Xi'an", name: "Xianyang", country: "China" },
  { code: "HGH", icao: "ZSHC", city: "Hangzhou", name: "Xiaoshan", country: "China" },
  { code: "NKG", icao: "ZSNJ", city: "Nanjing", name: "Lukou", country: "China" },
  { code: "WUH", icao: "ZHHH", city: "Wuhan", name: "Tianhe", country: "China" },
  { code: "CKG", icao: "ZUCK", city: "Chongqing", name: "Jiangbei", country: "China" },
  
  // Hong Kong, Macau, Taiwan
  { code: "HKG", icao: "VHHH", city: "Hong Kong", name: "Hong Kong International", country: "Hong Kong" },
  { code: "MFM", icao: "VMMC", city: "Macau", name: "Macau International", country: "Macau" },
  { code: "TPE", icao: "RCTP", city: "Taipei", name: "Taiwan Taoyuan International", country: "Taiwan" },
  { code: "TSA", icao: "RCSS", city: "Taipei", name: "Taipei Songshan", country: "Taiwan" },
  { code: "KHH", icao: "RCKH", city: "Kaohsiung", name: "Kaohsiung", country: "Taiwan" },
  
  // Southeast Asia
  { code: "SIN", icao: "WSSS", city: "Singapore", name: "Changi", country: "Singapore" },
  { code: "BKK", icao: "VTBS", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand", metroArea: "Bangkok" },
  { code: "DMK", icao: "VTBD", city: "Bangkok", name: "Don Mueang", country: "Thailand", metroArea: "Bangkok" },
  { code: "HKT", icao: "VTSP", city: "Phuket", name: "Phuket International", country: "Thailand" },
  { code: "CNX", icao: "VTCC", city: "Chiang Mai", name: "Chiang Mai International", country: "Thailand" },
  { code: "KUL", icao: "WMKK", city: "Kuala Lumpur", name: "Kuala Lumpur International", country: "Malaysia" },
  { code: "PEN", icao: "WMKP", city: "Penang", name: "Penang International", country: "Malaysia" },
  { code: "CGK", icao: "WIII", city: "Jakarta", name: "Soekarno-Hatta", country: "Indonesia" },
  { code: "DPS", icao: "WADD", city: "Denpasar", name: "Ngurah Rai", country: "Indonesia", aliases: ["Bali"] },
  { code: "MNL", icao: "RPLL", city: "Manila", name: "Ninoy Aquino", country: "Philippines" },
  { code: "CEB", icao: "RPVM", city: "Cebu", name: "Mactan-Cebu", country: "Philippines" },
  { code: "SGN", icao: "VVTS", city: "Ho Chi Minh City", name: "Tan Son Nhat", country: "Vietnam", aliases: ["Saigon"] },
  { code: "HAN", icao: "VVNB", city: "Hanoi", name: "Noi Bai", country: "Vietnam" },
  { code: "DAD", icao: "VVDN", city: "Da Nang", name: "Da Nang International", country: "Vietnam" },
  { code: "RGN", icao: "VYYY", city: "Yangon", name: "Yangon International", country: "Myanmar" },
  { code: "PNH", icao: "VDPP", city: "Phnom Penh", name: "Phnom Penh International", country: "Cambodia" },
  { code: "REP", icao: "VDSR", city: "Siem Reap", name: "Siem Reap International", country: "Cambodia", aliases: ["Angkor Wat"] },
  
  // India
  { code: "DEL", icao: "VIDP", city: "Delhi", name: "Indira Gandhi International", country: "India" },
  { code: "BOM", icao: "VABB", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj", country: "India", aliases: ["Bombay"] },
  { code: "BLR", icao: "VOBL", city: "Bangalore", name: "Kempegowda International", country: "India", aliases: ["Bengaluru"] },
  { code: "MAA", icao: "VOMM", city: "Chennai", name: "Chennai International", country: "India", aliases: ["Madras"] },
  { code: "HYD", icao: "VOHS", city: "Hyderabad", name: "Rajiv Gandhi International", country: "India" },
  { code: "CCU", icao: "VECC", city: "Kolkata", name: "Netaji Subhas Chandra Bose", country: "India", aliases: ["Calcutta"] },
  { code: "COK", icao: "VOCI", city: "Kochi", name: "Cochin International", country: "India" },
  { code: "GOI", icao: "VOGO", city: "Goa", name: "Manohar International", country: "India" },
  
  // Middle East
  { code: "DXB", icao: "OMDB", city: "Dubai", name: "Dubai International", country: "UAE" },
  { code: "AUH", icao: "OMAA", city: "Abu Dhabi", name: "Abu Dhabi International", country: "UAE" },
  { code: "DOH", icao: "OTHH", city: "Doha", name: "Hamad International", country: "Qatar" },
  { code: "AUH", icao: "OMAA", city: "Abu Dhabi", name: "Abu Dhabi International", country: "UAE" },
  { code: "JED", icao: "OEJN", city: "Jeddah", name: "King Abdulaziz International", country: "Saudi Arabia" },
  { code: "RUH", icao: "OERK", city: "Riyadh", name: "King Khalid International", country: "Saudi Arabia" },
  { code: "BAH", icao: "OBBI", city: "Manama", name: "Bahrain International", country: "Bahrain" },
  { code: "MCT", icao: "OOMS", city: "Muscat", name: "Muscat International", country: "Oman" },
  { code: "KWI", icao: "OKBK", city: "Kuwait City", name: "Kuwait International", country: "Kuwait" },
  { code: "AMM", icao: "OJAI", city: "Amman", name: "Queen Alia International", country: "Jordan" },
  { code: "BEY", icao: "OLBA", city: "Beirut", name: "Rafic Hariri International", country: "Lebanon" },
  { code: "TLV", icao: "LLBG", city: "Tel Aviv", name: "Ben Gurion", country: "Israel" },
  
  // ===== OCEANIA =====
  { code: "SYD", icao: "YSSY", city: "Sydney", name: "Kingsford Smith", country: "Australia" },
  { code: "MEL", icao: "YMML", city: "Melbourne", name: "Tullamarine", country: "Australia" },
  { code: "BNE", icao: "YBBN", city: "Brisbane", name: "Brisbane", country: "Australia" },
  { code: "PER", icao: "YPPH", city: "Perth", name: "Perth", country: "Australia" },
  { code: "ADL", icao: "YPAD", city: "Adelaide", name: "Adelaide", country: "Australia" },
  { code: "CNS", icao: "YBCS", city: "Cairns", name: "Cairns", country: "Australia", aliases: ["Great Barrier Reef"] },
  { code: "OOL", icao: "YBCG", city: "Gold Coast", name: "Gold Coast", country: "Australia" },
  { code: "AKL", icao: "NZAA", city: "Auckland", name: "Auckland", country: "New Zealand" },
  { code: "WLG", icao: "NZWN", city: "Wellington", name: "Wellington", country: "New Zealand" },
  { code: "CHC", icao: "NZCH", city: "Christchurch", name: "Christchurch", country: "New Zealand" },
  { code: "ZQN", icao: "NZQN", city: "Queenstown", name: "Queenstown", country: "New Zealand" },
  { code: "NAN", icao: "NFFN", city: "Nadi", name: "Nadi International", country: "Fiji" },
  { code: "PPT", icao: "NTAA", city: "Papeete", name: "Faa'a International", country: "French Polynesia", aliases: ["Tahiti"] },
  
  // ===== AFRICA =====
  { code: "JNB", icao: "FAOR", city: "Johannesburg", name: "O.R. Tambo International", country: "South Africa" },
  { code: "CPT", icao: "FACT", city: "Cape Town", name: "Cape Town International", country: "South Africa" },
  { code: "DUR", icao: "FALE", city: "Durban", name: "King Shaka International", country: "South Africa" },
  { code: "CAI", icao: "HECA", city: "Cairo", name: "Cairo International", country: "Egypt" },
  { code: "SSH", icao: "HESH", city: "Sharm El Sheikh", name: "Sharm El Sheikh International", country: "Egypt" },
  { code: "HRG", icao: "HEGN", city: "Hurghada", name: "Hurghada International", country: "Egypt" },
  { code: "CMN", icao: "GMMN", city: "Casablanca", name: "Mohammed V International", country: "Morocco" },
  { code: "RAK", icao: "GMMX", city: "Marrakech", name: "Menara", country: "Morocco" },
  { code: "TUN", icao: "DTTA", city: "Tunis", name: "Tunis-Carthage", country: "Tunisia" },
  { code: "ALG", icao: "DAAG", city: "Algiers", name: "Houari Boumediene", country: "Algeria" },
  { code: "NBO", icao: "HKJK", city: "Nairobi", name: "Jomo Kenyatta International", country: "Kenya" },
  { code: "MBA", icao: "HKMO", city: "Mombasa", name: "Moi International", country: "Kenya" },
  { code: "ADD", icao: "HAAB", city: "Addis Ababa", name: "Bole International", country: "Ethiopia" },
  { code: "LOS", icao: "DNMM", city: "Lagos", name: "Murtala Muhammed International", country: "Nigeria" },
  { code: "ACC", icao: "DGAA", city: "Accra", name: "Kotoka International", country: "Ghana" },
  { code: "DSS", icao: "GOBD", city: "Dakar", name: "Blaise Diagne International", country: "Senegal" },
  { code: "MRU", icao: "FIMP", city: "Port Louis", name: "Sir Seewoosagur Ramgoolam International", country: "Mauritius" },
  { code: "SEZ", icao: "FSIA", city: "Mahé", name: "Seychelles International", country: "Seychelles" },
  { code: "DAR", icao: "HTDA", city: "Dar es Salaam", name: "Julius Nyerere International", country: "Tanzania" },
  { code: "ZNZ", icao: "HTZA", city: "Zanzibar", name: "Abeid Amani Karume International", country: "Tanzania", aliases: ["Zanzibar"] },
  
  // ===== AMERICAS =====
  // Canada
  { code: "YYZ", icao: "CYYZ", city: "Toronto", name: "Pearson International", country: "Canada", metroArea: "Toronto" },
  { code: "YVR", icao: "CYVR", city: "Vancouver", name: "Vancouver International", country: "Canada" },
  { code: "YUL", icao: "CYUL", city: "Montreal", name: "Trudeau International", country: "Canada" },
  { code: "YYC", icao: "CYYC", city: "Calgary", name: "Calgary International", country: "Canada" },
  { code: "YEG", icao: "CYEG", city: "Edmonton", name: "Edmonton International", country: "Canada" },
  { code: "YOW", icao: "CYOW", city: "Ottawa", name: "Ottawa Macdonald-Cartier", country: "Canada" },
  { code: "YWG", icao: "CYWG", city: "Winnipeg", name: "Winnipeg James Armstrong Richardson", country: "Canada" },
  { code: "YHZ", icao: "CYHZ", city: "Halifax", name: "Halifax Stanfield International", country: "Canada" },
  
  // Mexico
  { code: "MEX", icao: "MMMX", city: "Mexico City", name: "Benito Juárez International", country: "Mexico" },
  { code: "CUN", icao: "MMUN", city: "Cancun", name: "Cancún International", country: "Mexico" },
  { code: "GDL", icao: "MMGL", city: "Guadalajara", name: "Miguel Hidalgo y Costilla", country: "Mexico" },
  { code: "SJD", icao: "MMSD", city: "San José del Cabo", name: "Los Cabos International", country: "Mexico", aliases: ["Cabo", "Los Cabos"] },
  { code: "PVR", icao: "MMPR", city: "Puerto Vallarta", name: "Licenciado Gustavo Díaz Ordaz", country: "Mexico" },
  { code: "MTY", icao: "MMMY", city: "Monterrey", name: "General Mariano Escobedo", country: "Mexico" },
  
  // Caribbean
  { code: "NAS", icao: "MYNN", city: "Nassau", name: "Lynden Pindling International", country: "Bahamas" },
  { code: "MBJ", icao: "MKJS", city: "Montego Bay", name: "Sangster International", country: "Jamaica" },
  { code: "KIN", icao: "MKJP", city: "Kingston", name: "Norman Manley International", country: "Jamaica" },
  { code: "SJU", icao: "TJSJ", city: "San Juan", name: "Luis Muñoz Marín International", country: "Puerto Rico" },
  { code: "PUJ", icao: "MDPC", city: "Punta Cana", name: "Punta Cana International", country: "Dominican Republic" },
  { code: "SDQ", icao: "MDSD", city: "Santo Domingo", name: "Las Américas International", country: "Dominican Republic" },
  { code: "AUA", icao: "TNCA", city: "Oranjestad", name: "Queen Beatrix International", country: "Aruba" },
  { code: "CUR", icao: "TNCC", city: "Willemstad", name: "Curaçao International", country: "Curaçao" },
  { code: "SXM", icao: "TNCM", city: "Philipsburg", name: "Princess Juliana International", country: "Sint Maarten" },
  { code: "BGI", icao: "TBPB", city: "Bridgetown", name: "Grantley Adams International", country: "Barbados" },
  { code: "POS", icao: "TTPP", city: "Port of Spain", name: "Piarco International", country: "Trinidad and Tobago" },
  { code: "HAV", icao: "MUHA", city: "Havana", name: "José Martí International", country: "Cuba" },
  
  // Central America
  { code: "PTY", icao: "MPTO", city: "Panama City", name: "Tocumen International", country: "Panama" },
  { code: "SJO", icao: "MROC", city: "San José", name: "Juan Santamaría International", country: "Costa Rica" },
  { code: "LIR", icao: "MRLB", city: "Liberia", name: "Daniel Oduber Quirós International", country: "Costa Rica", aliases: ["Guanacaste"] },
  { code: "GUA", icao: "MGGT", city: "Guatemala City", name: "La Aurora International", country: "Guatemala" },
  { code: "SAL", icao: "MSLP", city: "San Salvador", name: "Óscar Arnulfo Romero International", country: "El Salvador" },
  { code: "TGU", icao: "MHTG", city: "Tegucigalpa", name: "Toncontín International", country: "Honduras" },
  { code: "MGA", icao: "MNMG", city: "Managua", name: "Augusto C. Sandino International", country: "Nicaragua" },
  { code: "BZE", icao: "MZBZ", city: "Belize City", name: "Philip S. W. Goldson International", country: "Belize" },
  
  // South America
  { code: "GRU", icao: "SBGR", city: "São Paulo", name: "Guarulhos International", country: "Brazil" },
  { code: "GIG", icao: "SBGL", city: "Rio de Janeiro", name: "Galeão International", country: "Brazil" },
  { code: "SDU", icao: "SBRJ", city: "Rio de Janeiro", name: "Santos Dumont", country: "Brazil" },
  { code: "BSB", icao: "SBBR", city: "Brasília", name: "Presidente Juscelino Kubitschek", country: "Brazil" },
  { code: "CNF", icao: "SBCF", city: "Belo Horizonte", name: "Confins International", country: "Brazil" },
  { code: "SSA", icao: "SBSV", city: "Salvador", name: "Deputado Luís Eduardo Magalhães", country: "Brazil" },
  { code: "FOR", icao: "SBFZ", city: "Fortaleza", name: "Pinto Martins International", country: "Brazil" },
  { code: "REC", icao: "SBRF", city: "Recife", name: "Guararapes–Gilberto Freyre", country: "Brazil" },
  { code: "POA", icao: "SBPA", city: "Porto Alegre", name: "Salgado Filho", country: "Brazil" },
  { code: "CWB", icao: "SBCT", city: "Curitiba", name: "Afonso Pena", country: "Brazil" },
  { code: "EZE", icao: "SAEZ", city: "Buenos Aires", name: "Ministro Pistarini International", country: "Argentina", aliases: ["Ezeiza"] },
  { code: "AEP", icao: "SABE", city: "Buenos Aires", name: "Jorge Newbery Airfield", country: "Argentina" },
  { code: "COR", icao: "SACO", city: "Córdoba", name: "Ingeniero Ambrosio Taravella", country: "Argentina" },
  { code: "MDZ", icao: "SAME", city: "Mendoza", name: "El Plumerillo", country: "Argentina" },
  { code: "BRC", icao: "SAZS", city: "San Carlos de Bariloche", name: "Teniente Luis Candelaria", country: "Argentina", aliases: ["Bariloche"] },
  { code: "SCL", icao: "SCEL", city: "Santiago", name: "Arturo Merino Benítez International", country: "Chile" },
  { code: "LIM", icao: "SPJC", city: "Lima", name: "Jorge Chávez International", country: "Peru" },
  { code: "CUZ", icao: "SPZO", city: "Cusco", name: "Alejandro Velasco Astete", country: "Peru", aliases: ["Machu Picchu"] },
  { code: "BOG", icao: "SKBO", city: "Bogotá", name: "El Dorado International", country: "Colombia" },
  { code: "MDE", icao: "SKRG", city: "Medellín", name: "José María Córdova International", country: "Colombia" },
  { code: "CTG", icao: "SKCG", city: "Cartagena", name: "Rafael Núñez International", country: "Colombia" },
  { code: "UIO", icao: "SEQM", city: "Quito", name: "Mariscal Sucre International", country: "Ecuador" },
  { code: "GYE", icao: "SEGU", city: "Guayaquil", name: "José Joaquín de Olmedo", country: "Ecuador" },
  { code: "CCS", icao: "SVMI", city: "Caracas", name: "Simón Bolívar International", country: "Venezuela" },
  { code: "MVD", icao: "SUMU", city: "Montevideo", name: "Carrasco International", country: "Uruguay" },
  { code: "ASU", icao: "SGAS", city: "Asunción", name: "Silvio Pettirossi International", country: "Paraguay" },
  { code: "LPB", icao: "SLLP", city: "La Paz", name: "El Alto International", country: "Bolivia" },
  { code: "VVI", icao: "SLVR", city: "Santa Cruz", name: "Viru Viru International", country: "Bolivia" },
];

// Country name variations and aliases
export const COUNTRY_ALIASES: Record<string, string> = {
  "US": "USA",
  "United States": "USA",
  "United States of America": "USA",
  "America": "USA",
  "UK": "UK",
  "United Kingdom": "UK",
  "Great Britain": "UK",
  "Britain": "UK",
  "England": "UK",
  "UAE": "UAE",
  "United Arab Emirates": "UAE",
  "Emirates": "UAE",
  "PRC": "China",
  "People's Republic of China": "China",
  "ROC": "Taiwan",
  "Republic of China": "Taiwan",
  "Korea": "South Korea",
  "ROK": "South Korea",
  "South Korea": "South Korea",
  "Republic of Korea": "South Korea",
  "DPRK": "North Korea",
  "The Netherlands": "Netherlands",
  "Holland": "Netherlands",
  "Czech Republic": "Czech Republic",
  "Czechia": "Czech Republic",
};

// Function to find airports by various criteria
export function findAirports(query: string): Airport[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for metro area search
  for (const [metro, codes] of Object.entries(METRO_AREAS)) {
    if (metro.toLowerCase().includes(normalizedQuery) || 
        normalizedQuery.includes(metro.toLowerCase())) {
      return AIRPORTS.filter(a => codes.includes(a.code));
    }
  }
  
  // Check for state search (US)
  for (const [state, data] of Object.entries(US_STATES)) {
    if (state.toLowerCase() === normalizedQuery || 
        data.abbrev.toLowerCase() === normalizedQuery) {
      return AIRPORTS.filter(a => a.state === state);
    }
  }
  
  // Standard search with ranking: exact > prefix > substring (term contains query)
  // Avoid the reverse "query.includes(term)" fallback for short codes like "anc"
  // which produced false positives ("vancouver" contains "anc").
  const scored = AIRPORTS.map(airport => {
    const terms = [
      airport.code,
      airport.icao,
      airport.city,
      airport.name,
      airport.country,
      airport.region,
      airport.state,
      airport.metroArea,
      ...(airport.aliases || [])
    ].filter(Boolean).map(s => s!.toLowerCase());

    let score = 0;
    for (const t of terms) {
      if (t === normalizedQuery) { score = Math.max(score, 100); continue; }
      if (t.startsWith(normalizedQuery)) { score = Math.max(score, 70); continue; }
      if (t.includes(normalizedQuery)) { score = Math.max(score, 40); continue; }
    }
    // Only allow reverse-contains (query includes term) for multi-word queries
    // where the term is itself a full word (city/country name >= 4 chars).
    if (score === 0 && normalizedQuery.includes(" ")) {
      for (const t of terms) {
        if (t.length >= 4 && normalizedQuery.split(/[\s,]+/).includes(t)) {
          score = Math.max(score, 30);
        }
      }
    }
    return { airport, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(x => x.airport);
}

// Get airports for a city with multiple airports
export function getMetroAreaAirports(city: string): Airport[] {
  const normalized = city.toLowerCase().trim();
  
  for (const [metro, codes] of Object.entries(METRO_AREAS)) {
    if (metro.toLowerCase().includes(normalized) || 
        normalized.includes(metro.toLowerCase())) {
      return AIRPORTS.filter(a => codes.includes(a.code));
    }
  }
  
  return AIRPORTS.filter(a => a.city.toLowerCase() === normalized);
}

// Resolve ambiguous place names
export function resolveAmbiguousLocation(location: string, context?: string): Airport[] {
  const normalized = location.toLowerCase().trim();
  const matches = findAirports(normalized);
  
  // Handle known ambiguous names
  if (normalized === "portland" || normalized === "pdx") {
    if (context?.toLowerCase().includes("maine") || context?.toLowerCase().includes("east")) {
      return AIRPORTS.filter(a => a.code === "PWM");
    }
    return AIRPORTS.filter(a => a.code === "PDX"); // Default to Oregon
  }
  
  if (normalized === "springfield") {
    // Default to the one with context, or return all
    return matches;
  }
  
  return matches;
}
