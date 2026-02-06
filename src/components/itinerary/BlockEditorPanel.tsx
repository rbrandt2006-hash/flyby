import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Plane, Building2, Users, UtensilsCrossed, Car, Clock, MapPin, Video, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  ItineraryBlock, 
  ItineraryBlockType, 
  blockTypeConfig,
  FlightBlock,
  HotelCheckinBlock,
  HotelCheckoutBlock,
  MeetingBlock,
  MealBlock,
  TransportBlock,
  FreeTimeBlock,
  CustomBlock,
} from "@/types/itinerary";

interface BlockEditorPanelProps {
  block: ItineraryBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Record<string, unknown>) => void;
  isNewBlock?: boolean;
  defaultType?: ItineraryBlockType;
}

export function BlockEditorPanel({
  block,
  isOpen,
  onClose,
  onSave,
  isNewBlock = false,
  defaultType = "meeting",
}: BlockEditorPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [blockType, setBlockType] = useState<ItineraryBlockType>(defaultType);
  
  useEffect(() => {
    if (block) {
      setFormData({ ...block });
      setBlockType(block.type);
    } else if (isNewBlock) {
      setFormData({
        type: defaultType,
        startTime: "09:00",
        endTime: "10:00",
      });
      setBlockType(defaultType);
    }
  }, [block, isNewBlock, defaultType]);
  
  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => {
    onSave({ ...formData, type: blockType });
    onClose();
  };
  
  const handleTypeChange = (newType: ItineraryBlockType) => {
    setBlockType(newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
    }));
  };
  
  // Type-safe accessor for form data
  const getField = <T,>(field: string, defaultValue: T): T => {
    return (formData[field] as T) ?? defaultValue;
  };
  
  const renderTypeFields = () => {
    switch (blockType) {
      case "flight":
        const flightData = formData as Partial<FlightBlock>;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Airline</Label>
                <Input
                  value={flightData.airline || ""}
                  onChange={(e) => updateField("airline" as keyof ItineraryBlock, e.target.value)}
                  placeholder="United Airlines"
                />
              </div>
              <div className="space-y-2">
                <Label>Flight Number</Label>
                <Input
                  value={flightData.flightNumber || ""}
                  onChange={(e) => updateField("flightNumber" as keyof ItineraryBlock, e.target.value)}
                  placeholder="UA 1234"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Airport</Label>
                <Input
                  value={flightData.departureAirport || ""}
                  onChange={(e) => updateField("departureAirport" as keyof ItineraryBlock, e.target.value)}
                  placeholder="SFO"
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Airport</Label>
                <Input
                  value={flightData.arrivalAirport || ""}
                  onChange={(e) => updateField("arrivalAirport" as keyof ItineraryBlock, e.target.value)}
                  placeholder="JFK"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input
                  value={flightData.departureTime || ""}
                  onChange={(e) => updateField("departureTime" as keyof ItineraryBlock, e.target.value)}
                  placeholder="7:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time</Label>
                <Input
                  value={flightData.arrivalTime || ""}
                  onChange={(e) => updateField("arrivalTime" as keyof ItineraryBlock, e.target.value)}
                  placeholder="10:00 AM"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Confirmation #</Label>
                <Input
                  value={flightData.confirmationNumber || ""}
                  onChange={(e) => updateField("confirmationNumber" as keyof ItineraryBlock, e.target.value)}
                  placeholder="ABC123"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Seat Number</Label>
                <Input
                  value={flightData.seatNumber || ""}
                  onChange={(e) => updateField("seatNumber" as keyof ItineraryBlock, e.target.value)}
                  placeholder="12A"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={flightData.isReturn || false}
                onCheckedChange={(checked) => updateField("isReturn" as keyof ItineraryBlock, checked)}
              />
              <Label>Return Flight</Label>
            </div>
          </div>
        );
        
      case "hotel_checkin":
        const checkinData = formData as Partial<HotelCheckinBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hotel Name</Label>
              <Input
                value={checkinData.hotelName || ""}
                onChange={(e) => updateField("hotelName" as keyof ItineraryBlock, e.target.value)}
                placeholder="The Westin St. Francis"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={checkinData.address || ""}
                onChange={(e) => updateField("address" as keyof ItineraryBlock, e.target.value)}
                placeholder="335 Powell St, San Francisco, CA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Confirmation #</Label>
                <Input
                  value={checkinData.confirmationNumber || ""}
                  onChange={(e) => updateField("confirmationNumber" as keyof ItineraryBlock, e.target.value)}
                  placeholder="HOTEL123"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Input
                  value={checkinData.roomType || ""}
                  onChange={(e) => updateField("roomType" as keyof ItineraryBlock, e.target.value)}
                  placeholder="King Suite"
                />
              </div>
            </div>
          </div>
        );
        
      case "hotel_checkout":
        const checkoutData = formData as Partial<HotelCheckoutBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hotel Name</Label>
              <Input
                value={checkoutData.hotelName || ""}
                onChange={(e) => updateField("hotelName" as keyof ItineraryBlock, e.target.value)}
                placeholder="The Westin St. Francis"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={checkoutData.address || ""}
                onChange={(e) => updateField("address" as keyof ItineraryBlock, e.target.value)}
                placeholder="335 Powell St, San Francisco, CA"
              />
            </div>
          </div>
        );
        
      case "meeting":
        const meetingData = formData as Partial<MeetingBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meeting Title</Label>
              <Input
                value={meetingData.title || ""}
                onChange={(e) => updateField("title" as keyof ItineraryBlock, e.target.value)}
                placeholder="Q4 Planning Session"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={meetingData.location || ""}
                onChange={(e) => updateField("location" as keyof ItineraryBlock, e.target.value)}
                placeholder="Client HQ, 123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client / Company</Label>
                <Input
                  value={meetingData.clientName || ""}
                  onChange={(e) => updateField("clientName" as keyof ItineraryBlock, e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <Input
                  value={(meetingData.attendees || []).join(", ")}
                  onChange={(e) => updateField("attendees" as keyof ItineraryBlock, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="John, Sarah, Mike"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Purpose (for expense compliance)</Label>
              <Input
                value={meetingData.businessPurpose || ""}
                onChange={(e) => updateField("businessPurpose" as keyof ItineraryBlock, e.target.value)}
                placeholder="Quarterly business review and contract renewal"
              />
            </div>
            <div className="space-y-2">
              <Label>Agenda</Label>
              <Textarea
                value={meetingData.agenda || ""}
                onChange={(e) => updateField("agenda" as keyof ItineraryBlock, e.target.value)}
                placeholder="Discuss Q4 goals, review metrics, plan for 2025..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={meetingData.isVirtual || false}
                onCheckedChange={(checked) => updateField("isVirtual" as keyof ItineraryBlock, checked)}
              />
              <Label>Virtual Meeting</Label>
            </div>
            {meetingData.isVirtual && (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <Input
                  value={meetingData.meetingLink || ""}
                  onChange={(e) => updateField("meetingLink" as keyof ItineraryBlock, e.target.value)}
                  placeholder="https://zoom.us/j/123456789"
                />
              </div>
            )}
          </div>
        );
        
      case "meal":
        const mealData = formData as Partial<MealBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select
                value={mealData.mealType || "lunch"}
                onValueChange={(value) => updateField("mealType" as keyof ItineraryBlock, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="coffee">Coffee Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venue Name</Label>
                <Input
                  value={mealData.venueName || ""}
                  onChange={(e) => updateField("venueName" as keyof ItineraryBlock, e.target.value)}
                  placeholder="The Capital Grille"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={mealData.location || ""}
                  onChange={(e) => updateField("location" as keyof ItineraryBlock, e.target.value)}
                  placeholder="Downtown"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dining With (Attendees)</Label>
              <Input
                value={(mealData.attendees || []).join(", ")}
                onChange={(e) => updateField("attendees" as keyof ItineraryBlock, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="Client team, John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Business Purpose</Label>
              <Input
                value={mealData.businessPurpose || ""}
                onChange={(e) => updateField("businessPurpose" as keyof ItineraryBlock, e.target.value)}
                placeholder="Client relationship building"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reservation Name</Label>
                <Input
                  value={mealData.reservationName || ""}
                  onChange={(e) => updateField("reservationName" as keyof ItineraryBlock, e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmation #</Label>
                <Input
                  value={mealData.reservationConfirmation || ""}
                  onChange={(e) => updateField("reservationConfirmation" as keyof ItineraryBlock, e.target.value)}
                  placeholder="RES123"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        );
        
      case "transport":
        const transportData = formData as Partial<TransportBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Transport Type</Label>
              <Select
                value={transportData.transportType || "uber"}
                onValueChange={(value) => updateField("transportType" as keyof ItineraryBlock, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uber">Uber</SelectItem>
                  <SelectItem value="lyft">Lyft</SelectItem>
                  <SelectItem value="rental">Rental Car</SelectItem>
                  <SelectItem value="shuttle">Shuttle</SelectItem>
                  <SelectItem value="taxi">Taxi</SelectItem>
                  <SelectItem value="subway">Subway/Metro</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Input
                  value={transportData.pickupLocation || ""}
                  onChange={(e) => updateField("pickupLocation" as keyof ItineraryBlock, e.target.value)}
                  placeholder="SFO Airport"
                />
              </div>
              <div className="space-y-2">
                <Label>Drop-off Location</Label>
                <Input
                  value={transportData.dropoffLocation || ""}
                  onChange={(e) => updateField("dropoffLocation" as keyof ItineraryBlock, e.target.value)}
                  placeholder="The Westin Hotel"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Cost ($)</Label>
                <Input
                  type="number"
                  value={transportData.estimatedCost || ""}
                  onChange={(e) => updateField("estimatedCost" as keyof ItineraryBlock, parseInt(e.target.value) || 0)}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmation #</Label>
                <Input
                  value={transportData.confirmationNumber || ""}
                  onChange={(e) => updateField("confirmationNumber" as keyof ItineraryBlock, e.target.value)}
                  placeholder="UBER123"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        );
        
      case "free_time":
        const freeTimeData = formData as Partial<FreeTimeBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity (optional)</Label>
              <Input
                value={freeTimeData.activity || ""}
                onChange={(e) => updateField("activity" as keyof ItineraryBlock, e.target.value)}
                placeholder="Personal time, rest, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input
                value={freeTimeData.location || ""}
                onChange={(e) => updateField("location" as keyof ItineraryBlock, e.target.value)}
                placeholder="Hotel room"
              />
            </div>
          </div>
        );
        
      case "custom":
        const customData = formData as Partial<CustomBlock>;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={customData.title || ""}
                onChange={(e) => updateField("title" as keyof ItineraryBlock, e.target.value)}
                placeholder="Activity name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={customData.description || ""}
                onChange={(e) => updateField("description" as keyof ItineraryBlock, e.target.value)}
                placeholder="Details about this activity..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={customData.location || ""}
                onChange={(e) => updateField("location" as keyof ItineraryBlock, e.target.value)}
                placeholder="Where this takes place"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {isNewBlock ? "Add Block" : "Edit Block"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Block type selector (only for new blocks) */}
              {isNewBlock && (
                <div className="space-y-2">
                  <Label>Block Type</Label>
                  <Select value={blockType} onValueChange={(v) => handleTypeChange(v as ItineraryBlockType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flight">Flight</SelectItem>
                      <SelectItem value="hotel_checkin">Hotel Check-in</SelectItem>
                      <SelectItem value="hotel_checkout">Hotel Check-out</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="meal">Business Meal</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="free_time">Free Time / Buffer</SelectItem>
                      <SelectItem value="custom">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={String(formData.startTime || "09:00")}
                    onChange={(e) => updateField("startTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={String(formData.endTime || "10:00")}
                    onChange={(e) => updateField("endTime", e.target.value)}
                  />
                </div>
              </div>
              
              {/* Type-specific fields */}
              {renderTypeFields()}
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={String(formData.notes || "")}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" />
                {isNewBlock ? "Add Block" : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
