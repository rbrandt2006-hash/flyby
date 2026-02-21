import { GlassPanel } from "./GlassPanel";

export function GlassLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-xl bg-muted/40" />
          <div className="h-4 w-56 rounded-lg bg-muted/30" />
        </div>
        <div className="h-10 w-64 rounded-2xl bg-muted/30" />
      </div>

      {/* Segmented control skeleton */}
      <div className="flex gap-1 h-11 w-80 rounded-2xl bg-muted/20 p-1">
        <div className="flex-1 rounded-xl bg-muted/30" />
        <div className="flex-1 rounded-xl bg-muted/20" />
        <div className="flex-1 rounded-xl bg-muted/20" />
      </div>

      {/* Section skeletons */}
      {[1, 2].map((section) => (
        <GlassPanel key={section} className="p-6 space-y-4">
          <div className="h-5 w-44 rounded-lg bg-muted/30" />
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="glass-row rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="h-11 w-11 rounded-full bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-lg bg-muted/30" />
                  <div className="h-3 w-48 rounded-lg bg-muted/20" />
                </div>
                <div className="h-6 w-20 rounded-full bg-muted/20" />
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
