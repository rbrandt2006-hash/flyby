import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunctionalToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void | Promise<boolean> | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
}

export function FunctionalToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  isLoading = false,
  isSaving = false,
}: FunctionalToggleProps) {
  const isDisabled = disabled || isLoading || isSaving;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <Label
          htmlFor={id}
          className={cn(
            "font-medium text-sm cursor-pointer",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="relative flex items-center">
        {isSaving && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
        )}
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={isDisabled}
          aria-checked={checked}
          aria-label={label}
          aria-describedby={description ? `${id}-description` : undefined}
        />
        {description && (
          <span id={`${id}-description`} className="sr-only">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
