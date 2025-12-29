import { motion } from "framer-motion";
import { Brain, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreferencesIndicatorProps {
  labels: string[];
  showLearnedBadge?: boolean;
  className?: string;
}

export function PreferencesIndicator({ 
  labels, 
  showLearnedBadge = false,
  className 
}: PreferencesIndicatorProps) {
  if (labels.length === 0 && !showLearnedBadge) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-2", className)}
    >
      {showLearnedBadge && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span>Based on past choices</span>
        </div>
      )}
      
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge
                variant="secondary"
                className="text-xs font-normal gap-1 bg-primary/10 text-primary border-primary/20"
              >
                <Lightbulb className="w-3 h-3" />
                {label}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
