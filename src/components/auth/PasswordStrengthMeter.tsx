import { useMemo } from "react";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/passwordPolicy";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

const strengthColors: Record<string, string> = {
  weak: "bg-destructive",
  fair: "bg-orange-500",
  strong: "bg-emerald-500",
  "very-strong": "bg-emerald-600",
};

const strengthLabels: Record<string, string> = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  "very-strong": "Very Strong",
};

const strengthWidths: Record<string, string> = {
  weak: "w-1/4",
  fair: "w-2/4",
  strong: "w-3/4",
  "very-strong": "w-full",
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const check = useMemo(() => validatePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strengthColors[check.strength],
              strengthWidths[check.strength]
            )}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium min-w-[70px] text-right">
          {strengthLabels[check.strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = !check.errors.some((e) => req.toLowerCase().includes(e.split(" ").slice(0, 2).join(" ").toLowerCase()));
          // Simpler: check if the error list includes something related
          const passed = !check.errors.some(err => {
            // Match by keyword
            if (req.includes("characters") && err.includes("characters")) return true;
            if (req.includes("uppercase") && err.includes("uppercase")) return true;
            if (req.includes("lowercase") && err.includes("lowercase")) return true;
            if (req.includes("number") && err.includes("number")) return true;
            if (req.includes("special") && err.includes("special")) return true;
            return false;
          });

          return (
            <li key={req} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={cn(passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {req}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
