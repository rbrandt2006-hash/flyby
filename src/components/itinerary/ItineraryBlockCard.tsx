import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Building2, LogOut, Users, UtensilsCrossed, Car, Clock, 
  MoreHorizontal, GripVertical, ChevronDown, ChevronUp, Trash2, 
  Copy, Edit2, MapPin, Briefcase, Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ItineraryBlock, 
  blockTypeConfig, 
  formatBlockTime,
  FlightBlock,
  HotelCheckinBlock,
  HotelCheckoutBlock,
  MeetingBlock,
  MealBlock,
  TransportBlock,
  FreeTimeBlock,
  CustomBlock,
} from "@/types/itinerary";

const iconMap = {
  Plane,
  Building2,
  LogOut,
  Users,
  UtensilsCrossed,
  Car,
  Clock,
  MoreHorizontal,
};

interface ItineraryBlockCardProps {
  block: ItineraryBlock;
  isEditing: boolean;
  hasWarning?: boolean;
  warningMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function ItineraryBlockCard({
  block,
  isEditing,
  hasWarning,
  warningMessage,
  onEdit,
  onDelete,
  onDuplicate,
  dragHandleProps,
}: ItineraryBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = blockTypeConfig[block.type];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || MoreHorizontal;
  
  const renderBlockContent = () => {
    switch (block.type) {
      case "flight":
        const flight = block as FlightBlock;
        return (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{flight.airline}</span>
              {flight.flightNumber && (
                <Badge variant="secondary" className="text-xs">
                  {flight.flightNumber}
                </Badge>
              )}
              {flight.isReturn && (
                <Badge variant="outline" className="text-xs">Return</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {flight.departureAirport} → {flight.arrivalAirport}
            </p>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50 space-y-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Departure: {flight.departureTime} • Arrival: {flight.arrivalTime}
                  </span>
                </div>
                {flight.confirmationNumber && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Confirmation: </span>
                    <span className="font-mono text-foreground">{flight.confirmationNumber}</span>
                  </div>
                )}
                {flight.seatNumber && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Seat: </span>
                    <span className="font-medium">{flight.seatNumber}</span>
                  </div>
                )}
              </motion.div>
            )}
          </>
        );
        
      case "hotel_checkin":
        const checkin = block as HotelCheckinBlock;
        return (
          <>
            <p className="font-medium text-foreground">{checkin.hotelName}</p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {checkin.address}
            </p>
            {isExpanded && checkin.confirmationNumber && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50"
              >
                <div className="text-sm">
                  <span className="text-muted-foreground">Confirmation: </span>
                  <span className="font-mono text-foreground">{checkin.confirmationNumber}</span>
                </div>
                {checkin.roomType && (
                  <div className="text-sm mt-1">
                    <span className="text-muted-foreground">Room: </span>
                    <span>{checkin.roomType}</span>
                  </div>
                )}
              </motion.div>
            )}
          </>
        );
        
      case "hotel_checkout":
        const checkout = block as HotelCheckoutBlock;
        return (
          <>
            <p className="font-medium text-foreground">{checkout.hotelName}</p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {checkout.address}
            </p>
          </>
        );
        
      case "meeting":
        const meeting = block as MeetingBlock;
        return (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{meeting.title}</span>
              {meeting.isVirtual && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Video className="w-3 h-3" />
                  Virtual
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {meeting.location}
            </p>
            {meeting.clientName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {meeting.clientName}
              </p>
            )}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50 space-y-2"
              >
                {meeting.businessPurpose && (
                  <div className="text-sm flex items-start gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{meeting.businessPurpose}</span>
                  </div>
                )}
                {meeting.attendees.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Attendees: </span>
                    <span>{meeting.attendees.join(", ")}</span>
                  </div>
                )}
                {meeting.agenda && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Agenda: </span>
                    <span>{meeting.agenda}</span>
                  </div>
                )}
                {meeting.meetingLink && (
                  <a 
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Join Meeting Link
                  </a>
                )}
              </motion.div>
            )}
          </>
        );
        
      case "meal":
        const meal = block as MealBlock;
        const mealTypeLabels = {
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
          coffee: "Coffee Meeting",
        };
        return (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {mealTypeLabels[meal.mealType]}
              </span>
              {meal.venueName && (
                <span className="text-muted-foreground">at {meal.venueName}</span>
              )}
            </div>
            {meal.location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {meal.location}
              </p>
            )}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50 space-y-2"
              >
                {meal.businessPurpose && (
                  <div className="text-sm flex items-start gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{meal.businessPurpose}</span>
                  </div>
                )}
                {meal.attendees && meal.attendees.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">With: </span>
                    <span>{meal.attendees.join(", ")}</span>
                  </div>
                )}
                {meal.reservationConfirmation && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reservation: </span>
                    <span className="font-mono">{meal.reservationConfirmation}</span>
                  </div>
                )}
              </motion.div>
            )}
          </>
        );
        
      case "transport":
        const transport = block as TransportBlock;
        const transportLabels = {
          uber: "Uber",
          lyft: "Lyft",
          rental: "Rental Car",
          shuttle: "Shuttle",
          taxi: "Taxi",
          subway: "Subway/Metro",
          walking: "Walking",
        };
        return (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {transportLabels[transport.transportType]}
              </span>
              {transport.estimatedCost && (
                <Badge variant="secondary" className="text-xs">
                  ~${transport.estimatedCost}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {transport.pickupLocation} → {transport.dropoffLocation}
            </p>
            {isExpanded && transport.confirmationNumber && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50"
              >
                <div className="text-sm">
                  <span className="text-muted-foreground">Confirmation: </span>
                  <span className="font-mono">{transport.confirmationNumber}</span>
                </div>
              </motion.div>
            )}
          </>
        );
        
      case "free_time":
        const freeTime = block as FreeTimeBlock;
        return (
          <>
            <p className="font-medium text-foreground">
              {freeTime.activity || "Free Time / Buffer"}
            </p>
            {freeTime.location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {freeTime.location}
              </p>
            )}
          </>
        );
        
      case "custom":
        const custom = block as CustomBlock;
        return (
          <>
            <p className="font-medium text-foreground">{custom.title}</p>
            {custom.description && (
              <p className="text-sm text-muted-foreground mt-1">{custom.description}</p>
            )}
            {custom.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {custom.location}
              </p>
            )}
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "relative bg-card border rounded-xl transition-all duration-200",
        hasWarning ? "border-warning/50 ring-1 ring-warning/20" : "border-border/50",
        isEditing && "hover:border-primary/30 hover:shadow-md cursor-pointer group"
      )}
      onClick={isEditing ? onEdit : undefined}
    >
      {/* Warning indicator */}
      {hasWarning && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center">
            <span className="text-xs text-warning-foreground font-bold">!</span>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle (edit mode only) */}
          {isEditing && (
            <div 
              {...dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          
          {/* Time column */}
          <div className="shrink-0 text-center w-16">
            <p className="text-sm font-medium text-foreground">
              {formatBlockTime(block.startTime)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBlockTime(block.endTime)}
            </p>
          </div>
          
          {/* Icon */}
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bgColor)}>
            <IconComponent className={cn("w-5 h-5", config.color)} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence>
              {renderBlockContent()}
            </AnimatePresence>
            
            {/* Notes */}
            {block.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: {block.notes}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Expand/collapse for blocks with more details */}
            {["flight", "hotel_checkin", "meeting", "meal", "transport"].includes(block.type) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
            
            {/* Edit mode actions */}
            {isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Warning message tooltip */}
      {hasWarning && warningMessage && (
        <div className="px-4 pb-3">
          <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
            ⚠️ {warningMessage}
          </p>
        </div>
      )}
    </motion.div>
  );
}
