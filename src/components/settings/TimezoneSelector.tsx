import { useState, useEffect, useCallback } from "react";
import { backend, isUnauthenticated } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

// Common timezones grouped by region
const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: "UTC-9" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", offset: "UTC-10" },
  { value: "Europe/London", label: "London (GMT)", offset: "UTC+0" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "UTC+1" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "UTC+1" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "UTC+3" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Kolkata", label: "India (IST)", offset: "UTC+5:30" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)", offset: "UTC+11" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT)", offset: "UTC+13" },
];

export function TimezoneSelector() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current timezone from database
  const fetchTimezone = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await backend
        .from("profiles")
        .select("timezone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.timezone) {
        setTimezone(data.timezone);
      }
    } catch (err) {
      // Signed out or browsing as a guest: keep the local timezone, quietly.
      if (!isUnauthenticated(err)) {
        console.error("Failed to fetch timezone:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTimezone();
  }, [fetchTimezone]);

  const handleTimezoneChange = async (newTimezone: string) => {
    if (!user) {
      toast.error("You must be logged in to change settings");
      return;
    }

    const previousTimezone = timezone;
    setTimezone(newTimezone);
    setIsSaving(true);

    try {
      const { error } = await backend
        .from("profiles")
        .update({ timezone: newTimezone, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Timezone updated");
    } catch (err) {
      console.error("Failed to update timezone:", err);
      setTimezone(previousTimezone);
      toast.error("Failed to save timezone");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTz = timezones.find((tz) => tz.value === timezone);

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Time zone</Label>
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
        <Select
          value={timezone}
          onValueChange={handleTimezoneChange}
          disabled={isLoading || isSaving}
        >
          <SelectTrigger
            id="timezone"
            className="h-11 rounded-xl pl-10"
            aria-label="Select timezone"
          >
            <SelectValue placeholder="Select timezone">
              {selectedTz ? `${selectedTz.label} (${selectedTz.offset})` : "Select timezone"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                <span className="flex items-center justify-between w-full gap-4">
                  <span>{tz.label}</span>
                  <span className="text-muted-foreground text-xs">{tz.offset}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
