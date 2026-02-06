import { 
  Car, 
  Plane, 
  Building2, 
  Utensils, 
  Users, 
  Leaf, 
  Train, 
  Bus, 
  Star,
  Clock,
  FileText,
  DoorOpen,
  Coffee,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Itinerary block type icons
export type ItineraryBlockIconType = 
  | "flight" 
  | "hotel_checkin" 
  | "hotel_checkout" 
  | "meeting" 
  | "meal" 
  | "transport" 
  | "free_time" 
  | "custom";

// Map block types to icons
const blockTypeIcons: Record<ItineraryBlockIconType, LucideIcon> = {
  flight: Plane,
  hotel_checkin: Building2,
  hotel_checkout: DoorOpen,
  meeting: Users,
  meal: Utensils,
  transport: Car,
  free_time: Coffee,
  custom: FileText,
};

interface BlockTypeIconProps {
  type: ItineraryBlockIconType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const blockSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function BlockTypeIcon({ type, className, size = "md" }: BlockTypeIconProps) {
  const Icon = blockTypeIcons[type] || FileText;
  return <Icon className={cn(blockSizeClasses[size], className)} />;
}

// Get block type label with icon
export function getBlockTypeLabel(type: ItineraryBlockIconType): string {
  const labels: Record<ItineraryBlockIconType, string> = {
    flight: "Flight",
    hotel_checkin: "Hotel Check-in",
    hotel_checkout: "Hotel Check-out",
    meeting: "Meeting",
    meal: "Business Meal",
    transport: "Transportation",
    free_time: "Free Time / Buffer",
    custom: "Other",
  };
  return labels[type] || "Other";
}

// Brand provider icons
export type BrandProviderType = 
  | "uber" 
  | "lyft" 
  | "hertz" 
  | "enterprise" 
  | "avis"
  | "delta"
  | "united"
  | "american"
  | "southwest"
  | "jetblue"
  | "alaska"
  | "teams"
  | "slack"
  | "google"
  | "outlook";

interface BrandIconProps {
  provider: BrandProviderType | string;
  type?: "rideshare" | "rental" | "airline" | "messaging" | "calendar";
  className?: string;
  size?: "sm" | "md" | "lg";
  showBackground?: boolean;
  backgroundClassName?: string;
}

const brandSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const containerSizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

// Fallback icons by type
const fallbackIcons: Record<string, LucideIcon> = {
  rideshare: Car,
  rental: Car,
  airline: Plane,
  messaging: Users,
  calendar: Clock,
  default: Star,
};

export function BrandIcon({ 
  provider, 
  type,
  className, 
  size = "md",
  showBackground = false,
  backgroundClassName,
}: BrandIconProps) {
  // For now, use lucide icons as fallbacks
  // In production, you would load actual SVG brand logos
  const FallbackIcon = (type && fallbackIcons[type]) || fallbackIcons.default;
  
  if (showBackground) {
    return (
      <div 
        className={cn(
          "rounded-xl bg-muted flex items-center justify-center shrink-0",
          containerSizeClasses[size],
          backgroundClassName
        )}
      >
        <FallbackIcon className={cn(brandSizeClasses[size], "text-foreground", className)} />
      </div>
    );
  }
  
  return <FallbackIcon className={cn(brandSizeClasses[size], "text-foreground", className)} />;
}

// Rating star component (not emoji)
interface RatingStarProps {
  filled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingStar({ filled = true, className, size = "sm" }: RatingStarProps) {
  return (
    <Star 
      className={cn(
        brandSizeClasses[size],
        filled ? "text-amber-500 fill-amber-500" : "text-muted-foreground",
        className
      )} 
    />
  );
}

// Airline logo component (returns proper icon, not emoji)
export function getAirlineLogo(airline: string): LucideIcon {
  // All airlines use the Plane icon - no emojis
  return Plane;
}

export default BrandIcon;
