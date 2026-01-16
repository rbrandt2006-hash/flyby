import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plane } from "lucide-react";
import { AIRPORTS, findAirports, type Airport } from "@/data/globalAirports";

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