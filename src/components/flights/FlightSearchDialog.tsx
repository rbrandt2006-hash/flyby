import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plane, ArrowRightLeft, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AirportAutocomplete } from "./AirportAutocomplete";

interface FlightSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlightSearchDialog({ open, onOpenChange }: FlightSearchDialogProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState("1");
  const [tripType, setTripType] = useState("roundtrip");
  const [cabinClass, setCabinClass] = useState("economy");

  const handleSearch = () => {
    // Build Google Flights URL with search parameters
    const baseUrl = "https://www.google.com/travel/flights";
    const params = new URLSearchParams();
    
    // Google Flights uses specific URL structure
    let url = `${baseUrl}?q=flights`;
    
    if (origin) {
      url += `+from+${encodeURIComponent(origin)}`;
    }
    if (destination) {
      url += `+to+${encodeURIComponent(destination)}`;
    }
    if (departureDate) {
      url += `+on+${format(departureDate, "yyyy-MM-dd")}`;
    }
    if (returnDate && tripType === "roundtrip") {
      url += `+return+${format(returnDate, "yyyy-MM-dd")}`;
    }
    
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="w-5 h-5 text-primary" />
            Search Flights
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trip Type & Class */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Trip Type</Label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roundtrip">Round Trip</SelectItem>
                  <SelectItem value="oneway">One Way</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Cabin Class</Label>
              <Select value={cabinClass} onValueChange={setCabinClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Passengers</Label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {num} {num === 1 ? "Passenger" : "Passengers"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">From</Label>
              <AirportAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder="City or airport (e.g., LAX, New York)"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={swapLocations}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">To</Label>
              <AirportAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder="City or airport (e.g., JFK, London)"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Departure</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "EEE, MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={setDepartureDate}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {tripType === "roundtrip" && (
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Return</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "EEE, MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < (departureDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full h-12 text-base"
            disabled={!origin || !destination || !departureDate}
          >
            <Search className="w-5 h-5 mr-2" />
            Search Flights on Google Flights
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to Google Flights to view and compare prices across all airlines
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}