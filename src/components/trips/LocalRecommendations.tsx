import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Utensils, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  name: string;
  type: "restaurant" | "cafe" | "bar";
  distance: string;
  tag: string;
  rating?: number;
}

const mockRecommendations: Recommendation[] = [];

export function LocalRecommendations() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Utensils className="w-4 h-4 text-primary" />
        <h4 className="font-medium text-foreground">Nearby Recommendations</h4>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {mockRecommendations.map((rec) => (
          <Card 
            key={rec.id}
            className={cn(
              "min-w-[180px] flex-shrink-0 cursor-pointer",
              "border-border/50 bg-muted/30",
              "hover:border-primary/20 hover:bg-muted/50",
              "transition-all duration-200"
            )}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <h5 className="font-medium text-sm text-foreground line-clamp-1">
                  {rec.name}
                </h5>
                {rec.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{rec.rating}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{rec.distance} from hotel</span>
              </div>
              
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20"
              >
                {rec.tag}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
