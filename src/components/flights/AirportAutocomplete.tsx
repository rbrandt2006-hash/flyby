import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plane } from "lucide-react";

// Common airports database
const AIRPORTS = [
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International", country: "USA" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International", country: "USA" },
  { code: "ORD", city: "Chicago", name: "O'Hare International", country: "USA" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International", country: "USA" },
  { code: "DEN", city: "Denver", name: "Denver International", country: "USA" },
  { code: "JFK", city: "New York", name: "John F. Kennedy International", country: "USA" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International", country: "USA" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International", country: "USA" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International", country: "USA" },
  { code: "MCO", city: "Orlando", name: "Orlando International", country: "USA" },
  { code: "EWR", city: "Newark", name: "Newark Liberty International", country: "USA" },
  { code: "MIA", city: "Miami", name: "Miami International", country: "USA" },
  { code: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor International", country: "USA" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "USA" },
  { code: "BOS", city: "Boston", name: "Logan International", country: "USA" },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International", country: "USA" },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan", country: "USA" },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia International", country: "USA" },
  { code: "LGA", city: "New York", name: "LaGuardia", country: "USA" },
  { code: "BWI", city: "Baltimore", name: "Baltimore/Washington International", country: "USA" },
  { code: "SLC", city: "Salt Lake City", name: "Salt Lake City International", country: "USA" },
  { code: "DCA", city: "Washington D.C.", name: "Ronald Reagan Washington National", country: "USA" },
  { code: "IAD", city: "Washington D.C.", name: "Washington Dulles International", country: "USA" },
  { code: "SAN", city: "San Diego", name: "San Diego International", country: "USA" },
  { code: "TPA", city: "Tampa", name: "Tampa International", country: "USA" },
  { code: "AUS", city: "Austin", name: "Austin-Bergstrom International", country: "USA" },
  { code: "PDX", city: "Portland", name: "Portland International", country: "USA" },
  { code: "HNL", city: "Honolulu", name: "Daniel K. Inouye International", country: "USA" },
  { code: "DAL", city: "Dallas", name: "Dallas Love Field", country: "USA" },
  { code: "MDW", city: "Chicago", name: "Chicago Midway International", country: "USA" },
  { code: "LHR", city: "London", name: "Heathrow", country: "UK" },
  { code: "LGW", city: "London", name: "Gatwick", country: "UK" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France" },
  { code: "ORY", city: "Paris", name: "Orly", country: "France" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "Germany" },
  { code: "MUC", city: "Munich", name: "Munich International", country: "Germany" },
  { code: "AMS", city: "Amsterdam", name: "Schiphol", country: "Netherlands" },
  { code: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas", country: "Spain" },
  { code: "BCN", city: "Barcelona", name: "Josep Tarradellas Barcelona–El Prat", country: "Spain" },
  { code: "FCO", city: "Rome", name: "Leonardo da Vinci–Fiumicino", country: "Italy" },
  { code: "MXP", city: "Milan", name: "Malpensa", country: "Italy" },
  { code: "DUB", city: "Dublin", name: "Dublin", country: "Ireland" },
  { code: "ZRH", city: "Zurich", name: "Zurich", country: "Switzerland" },
  { code: "VIE", city: "Vienna", name: "Vienna International", country: "Austria" },
  { code: "CPH", city: "Copenhagen", name: "Copenhagen", country: "Denmark" },
  { code: "ARN", city: "Stockholm", name: "Stockholm Arlanda", country: "Sweden" },
  { code: "OSL", city: "Oslo", name: "Oslo Gardermoen", country: "Norway" },
  { code: "HEL", city: "Helsinki", name: "Helsinki-Vantaa", country: "Finland" },
  { code: "LIS", city: "Lisbon", name: "Humberto Delgado", country: "Portugal" },
  { code: "BRU", city: "Brussels", name: "Brussels", country: "Belgium" },
  { code: "NRT", city: "Tokyo", name: "Narita International", country: "Japan" },
  { code: "HND", city: "Tokyo", name: "Haneda", country: "Japan" },
  { code: "ICN", city: "Seoul", name: "Incheon International", country: "South Korea" },
  { code: "PEK", city: "Beijing", name: "Beijing Capital International", country: "China" },
  { code: "PVG", city: "Shanghai", name: "Shanghai Pudong International", country: "China" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong International", country: "Hong Kong" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "Singapore" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand" },
  { code: "SYD", city: "Sydney", name: "Kingsford Smith", country: "Australia" },
  { code: "MEL", city: "Melbourne", name: "Tullamarine", country: "Australia" },
  { code: "AKL", city: "Auckland", name: "Auckland", country: "New Zealand" },
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "UAE" },
  { code: "DOH", city: "Doha", name: "Hamad International", country: "Qatar" },
  { code: "IST", city: "Istanbul", name: "Istanbul", country: "Turkey" },
  { code: "TLV", city: "Tel Aviv", name: "Ben Gurion", country: "Israel" },
  { code: "JNB", city: "Johannesburg", name: "O.R. Tambo International", country: "South Africa" },
  { code: "CAI", city: "Cairo", name: "Cairo International", country: "Egypt" },
  { code: "MEX", city: "Mexico City", name: "Benito Juárez International", country: "Mexico" },
  { code: "CUN", city: "Cancun", name: "Cancún International", country: "Mexico" },
  { code: "GRU", city: "São Paulo", name: "Guarulhos International", country: "Brazil" },
  { code: "GIG", city: "Rio de Janeiro", name: "Galeão International", country: "Brazil" },
  { code: "EZE", city: "Buenos Aires", name: "Ministro Pistarini International", country: "Argentina" },
  { code: "SCL", city: "Santiago", name: "Arturo Merino Benítez International", country: "Chile" },
  { code: "BOG", city: "Bogotá", name: "El Dorado International", country: "Colombia" },
  { code: "LIM", city: "Lima", name: "Jorge Chávez International", country: "Peru" },
  { code: "YYZ", city: "Toronto", name: "Pearson International", country: "Canada" },
  { code: "YVR", city: "Vancouver", name: "Vancouver International", country: "Canada" },
  { code: "YUL", city: "Montreal", name: "Trudeau International", country: "Canada" },
  { code: "YYC", city: "Calgary", name: "Calgary International", country: "Canada" },
];

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AirportAutocomplete({ 
  value, 
  onChange, 
  placeholder = "City or airport",
  className 
}: AirportAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<typeof AIRPORTS>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    onChange(query);

    if (query.length >= 1) {
      const filtered = AIRPORTS.filter((airport) => {
        const searchStr = query.toLowerCase();
        return (
          airport.code.toLowerCase().includes(searchStr) ||
          airport.city.toLowerCase().includes(searchStr) ||
          airport.name.toLowerCase().includes(searchStr) ||
          airport.country.toLowerCase().includes(searchStr)
        );
      }).slice(0, 8);
      
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (airport: typeof AIRPORTS[0]) => {
    const selectedValue = `${airport.city} (${airport.code})`;
    setInputValue(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    if (inputValue.length >= 1 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn("h-12", className)}
        autoComplete="off"
        spellCheck={false}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            {suggestions.map((airport) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => handleSelect(airport)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Plane className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{airport.code}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-foreground truncate">{airport.city}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {airport.name}, {airport.country}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}