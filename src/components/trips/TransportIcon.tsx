import { 
  Car, 
  CarTaxiFront, 
  Users, 
  Leaf, 
  Bus, 
  Train, 
  CarFront,
  type LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon identifiers for ground transport options
export type TransportIconType = 
  | "car" 
  | "car-taxi" 
  | "car-comfort" 
  | "car-xl" 
  | "car-black" 
  | "car-suv" 
  | "car-green" 
  | "car-share" 
  | "rental-economy"
  | "rental-midsize"
  | "rental-suv"
  | "rental-luxury"
  | "transit-rail"
  | "transit-bus"
  | "uber"
  | "rideshare"
  | "rental"
  | "public";

interface TransportIconProps {
  type: TransportIconType | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBackground?: boolean;
  backgroundClassName?: string;
}

// Map icon types to Lucide icons and colors
const iconConfig: Record<string, { Icon: LucideIcon; colorClass: string }> = {
  // Rideshare types
  "car": { Icon: Car, colorClass: "text-foreground" },
  "car-taxi": { Icon: CarTaxiFront, colorClass: "text-foreground" },
  "car-comfort": { Icon: CarFront, colorClass: "text-foreground" },
  "car-xl": { Icon: Car, colorClass: "text-foreground" },
  "car-black": { Icon: CarFront, colorClass: "text-foreground" },
  "car-suv": { Icon: Car, colorClass: "text-foreground" },
  "car-green": { Icon: Leaf, colorClass: "text-green-600" },
  "car-share": { Icon: Users, colorClass: "text-primary" },
  
  // Rental types
  "rental-economy": { Icon: Car, colorClass: "text-foreground" },
  "rental-midsize": { Icon: Car, colorClass: "text-foreground" },
  "rental-suv": { Icon: Car, colorClass: "text-foreground" },
  "rental-luxury": { Icon: CarFront, colorClass: "text-foreground" },
  
  // Public transit types
  "transit-rail": { Icon: Train, colorClass: "text-foreground" },
  "transit-bus": { Icon: Bus, colorClass: "text-foreground" },
  
  // Category icons
  "uber": { Icon: Car, colorClass: "text-foreground" },
  "rideshare": { Icon: CarTaxiFront, colorClass: "text-foreground" },
  "rental": { Icon: CarFront, colorClass: "text-foreground" },
  "public": { Icon: Train, colorClass: "text-foreground" },
};

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const containerSizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export function TransportIcon({ 
  type, 
  size = "md", 
  className,
  showBackground = false,
  backgroundClassName,
}: TransportIconProps) {
  const config = iconConfig[type] || iconConfig["car"];
  const { Icon, colorClass } = config;

  if (showBackground) {
    return (
      <div 
        className={cn(
          "rounded-xl bg-muted flex items-center justify-center shrink-0",
          containerSizeClasses[size],
          backgroundClassName
        )}
      >
        <Icon className={cn(sizeClasses[size], colorClass, className)} />
      </div>
    );
  }

  return <Icon className={cn(sizeClasses[size], colorClass, className)} />;
}

// Section header icon component
export function SectionHeaderIcon({ 
  type, 
  className 
}: { 
  type: "rideshare" | "rental" | "public"; 
  className?: string;
}) {
  const icons: Record<string, LucideIcon> = {
    rideshare: CarTaxiFront,
    rental: CarFront,
    public: Train,
  };
  
  const Icon = icons[type] || Car;
  
  return <Icon className={cn("w-4 h-4 text-muted-foreground", className)} />;
}

export default TransportIcon;
