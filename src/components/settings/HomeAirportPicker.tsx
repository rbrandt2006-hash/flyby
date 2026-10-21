import { useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AIRPORTS, findAirports, type Airport } from "@/data/globalAirports";

/**
 * Where trips start when the request doesn't say.
 *
 * "Book me a trip to Chicago" has no origin. Without this the planner fell back
 * to a fixed airport for everyone; with it, the traveler's own home airport is
 * used, and saying "from Denver" in a request still overrides it.
 */

interface HomeAirportPickerProps {
  value: string | null;
  disabled?: boolean;
  onChange: (code: string | null) => void;
}

export function HomeAirportPicker({ value, disabled, onChange }: HomeAirportPickerProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);

  const current = useMemo(
    () => (value ? AIRPORTS.find((a) => a.code === value) ?? null : null),
    [value],
  );

  const matches = useMemo<Airport[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return findAirports(q).slice(0, 6);
  }, [query]);

  const choose = (airport: Airport) => {
    onChange(airport.code);
    setQuery("");
    setEditing(false);
  };

  if (current && !editing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {current.city} <span className="text-muted-foreground font-normal">({current.code})</span>
          </p>
          <p className="text-xs text-muted-foreground truncate">{current.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={disabled}>
          Change
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(null)}
          disabled={disabled}
          title="Clear starting city"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) choose(matches[0]);
            if (e.key === "Escape") { setQuery(""); setEditing(false); }
          }}
          placeholder="Search a city or airport code, e.g. San Diego or SAN"
          disabled={disabled}
          autoFocus={editing}
        />
        {editing && (
          <Button variant="ghost" onClick={() => { setQuery(""); setEditing(false); }}>
            Cancel
          </Button>
        )}
      </div>
      {matches.length > 0 && (
        <div className="rounded-lg border border-border/60 divide-y divide-border/40 overflow-hidden">
          {matches.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => choose(airport)}
              disabled={disabled}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none flex items-center gap-3"
            >
              <span className="font-mono text-xs w-9 shrink-0 text-muted-foreground">{airport.code}</span>
              <span className="min-w-0">
                <span className="block text-sm truncate">{airport.city}, {airport.country}</span>
                <span className="block text-xs text-muted-foreground truncate">{airport.name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {query.trim().length >= 2 && matches.length === 0 && (
        <p className="text-xs text-muted-foreground">No airports match "{query.trim()}".</p>
      )}
    </div>
  );
}
