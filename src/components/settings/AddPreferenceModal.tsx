import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AddPreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "airline" | "hotel" | "custom";
  onAdd: (value: string) => void;
  isLoading?: boolean;
}

const typeConfig = {
  airline: {
    title: "Add Preferred Airline",
    description: "Enter the name of an airline you prefer to fly with.",
    label: "Airline Name",
    placeholder: "e.g., Delta, United, American",
  },
  hotel: {
    title: "Add Preferred Hotel",
    description: "Enter the name of a hotel brand you prefer to stay at.",
    label: "Hotel Brand",
    placeholder: "e.g., Marriott, Hilton, Hyatt",
  },
  custom: {
    title: "Add Custom Preference",
    description: "Add a special request or preference for your trips.",
    label: "Preference",
    placeholder: "e.g., Extra legroom, Quiet cabin, Late checkout",
  },
};

export function AddPreferenceModal({ open, onOpenChange, type, onAdd, isLoading }: AddPreferenceModalProps) {
  const [value, setValue] = useState("");
  const config = typeConfig[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="preference">{config.label}</Label>
            <Input
              id="preference"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 rounded-xl"
              placeholder={config.placeholder}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={isLoading || !value.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
