import { cn } from "@/lib/utils";
import { Hash, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

// Slack icon
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

// Teams icon
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z" />
    </svg>
  );
}

export type Platform = "all" | "slack" | "teams" | "flyby";

interface PlatformSelectorProps {
  selected: Platform;
  onSelect: (platform: Platform) => void;
  counts: { slack: number; teams: number; flyby: number };
}

const platforms: { id: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "all",
    label: "All",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-foreground",
  },
  {
    id: "slack",
    label: "Slack",
    icon: <SlackIcon className="w-5 h-5" />,
    color: "text-[#4A154B]",
  },
  {
    id: "teams",
    label: "Teams",
    icon: <TeamsIcon className="w-5 h-5" />,
    color: "text-[#6264A7]",
  },
  {
    id: "flyby",
    label: "FlyBy",
    icon: <Hash className="w-5 h-5" />,
    color: "text-primary",
  },
];

export function PlatformSelector({ selected, onSelect, counts }: PlatformSelectorProps) {
  return (
    <div className="flex flex-col items-center py-4 gap-1 h-full bg-secondary/40 rounded-2xl border shadow-sm border-border/60">
      {platforms.map((p) => {
        const isActive = selected === p.id;
        const count = p.id === "all" ? counts.slack + counts.teams + counts.flyby : counts[p.id as keyof typeof counts] || 0;
        return (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(p.id)}
            className={cn(
              "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150",
              isActive
                ? "bg-primary/10 shadow-sm"
                : "hover:bg-muted/60"
            )}
            title={p.label}
          >
            <span className={cn(isActive ? p.color : "text-muted-foreground/60")}>
              {p.icon}
            </span>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="platform-indicator"
                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
