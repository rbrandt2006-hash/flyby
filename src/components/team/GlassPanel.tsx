import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl",
          variant === "default" && "glass-panel",
          variant === "strong" && "glass-panel-strong",
          variant === "subtle" && "glass-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";
