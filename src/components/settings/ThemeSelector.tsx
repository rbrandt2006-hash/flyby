import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[80px]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            theme === value
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-primary/30 hover:bg-secondary/50 text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              theme === value ? "bg-primary/10" : "bg-secondary"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

// Compact version for dropdown
export function ThemeSelectorCompact() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "p-2 rounded-md transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
