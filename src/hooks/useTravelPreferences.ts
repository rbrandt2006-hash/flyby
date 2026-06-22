import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CostSensitivity = "low" | "medium" | "high";

export interface TravelPreferencesData {
  preferredSeat: "window" | "aisle" | "middle" | "no_preference";
  mealPreference: "standard" | "vegetarian" | "vegan" | "kosher" | "halal";
  preferredAirlines: string[];
  preferredHotelBrands: string[];
  preferredClass: "economy" | "business" | "first";
  budgetPerDay: number;
  customPreferences: string[];
  dietaryRestrictions: string | null;
  avoidLayovers: boolean;
  costSensitivity: CostSensitivity;
}

const defaultPreferences: TravelPreferencesData = {
  preferredSeat: "window",
  mealPreference: "standard",
  preferredAirlines: [],
  preferredHotelBrands: [],
  preferredClass: "economy",
  budgetPerDay: 300,
  customPreferences: [],
  dietaryRestrictions: null,
  avoidLayovers: false,
  costSensitivity: "medium",
};

export function useTravelPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TravelPreferencesData>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences from Supabase
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("travel_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          setPreferences({
            preferredSeat: (data.preferred_seat as TravelPreferencesData["preferredSeat"]) || "window",
            mealPreference: "standard", // Infer from dietary_restrictions
            preferredAirlines: data.preferred_airlines || [],
            preferredHotelBrands: data.preferred_hotel_brands || [],
            preferredClass: (data.preferred_class as TravelPreferencesData["preferredClass"]) || "economy",
            budgetPerDay: data.budget_threshold_per_day || 300,
            customPreferences: [],
            dietaryRestrictions: data.dietary_restrictions,
            avoidLayovers: (data as { avoid_layovers?: boolean }).avoid_layovers ?? false,
            costSensitivity:
              ((data as { cost_sensitivity?: string }).cost_sensitivity as CostSensitivity) || "medium",
          });
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  // Update seat preference
  const updateSeatPreference = useCallback(async (seat: TravelPreferencesData["preferredSeat"]) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ preferred_seat: seat, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, preferredSeat: seat }));
      toast.success("Seat preference updated");
    } catch (error) {
      console.error("Error updating seat preference:", error);
      toast.error("Failed to update seat preference");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Update meal preference (stored in dietary_restrictions)
  const updateMealPreference = useCallback(async (meal: TravelPreferencesData["mealPreference"]) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const dietaryValue = meal === "standard" ? null : meal;
      const { error } = await supabase
        .from("travel_preferences")
        .update({ dietary_restrictions: dietaryValue, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, mealPreference: meal, dietaryRestrictions: dietaryValue }));
      toast.success("Meal preference updated");
    } catch (error) {
      console.error("Error updating meal preference:", error);
      toast.error("Failed to update meal preference");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Add airline preference
  const addAirline = useCallback(async (airline: string) => {
    if (!user?.id || !airline.trim()) return;
    
    const newAirlines = [...preferences.preferredAirlines, airline.trim()];
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ preferred_airlines: newAirlines, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, preferredAirlines: newAirlines }));
      toast.success("Airline added");
    } catch (error) {
      console.error("Error adding airline:", error);
      toast.error("Failed to add airline");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences.preferredAirlines]);

  // Remove airline preference
  const removeAirline = useCallback(async (airline: string) => {
    if (!user?.id) return;
    
    const newAirlines = preferences.preferredAirlines.filter(a => a !== airline);
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ preferred_airlines: newAirlines, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, preferredAirlines: newAirlines }));
      toast.success("Airline removed");
    } catch (error) {
      console.error("Error removing airline:", error);
      toast.error("Failed to remove airline");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences.preferredAirlines]);

  // Add hotel brand preference
  const addHotelBrand = useCallback(async (brand: string) => {
    if (!user?.id || !brand.trim()) return;
    
    const newBrands = [...preferences.preferredHotelBrands, brand.trim()];
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ preferred_hotel_brands: newBrands, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, preferredHotelBrands: newBrands }));
      toast.success("Hotel brand added");
    } catch (error) {
      console.error("Error adding hotel brand:", error);
      toast.error("Failed to add hotel brand");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences.preferredHotelBrands]);

  // Remove hotel brand preference
  const removeHotelBrand = useCallback(async (brand: string) => {
    if (!user?.id) return;
    
    const newBrands = preferences.preferredHotelBrands.filter(b => b !== brand);
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ preferred_hotel_brands: newBrands, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, preferredHotelBrands: newBrands }));
      toast.success("Hotel brand removed");
    } catch (error) {
      console.error("Error removing hotel brand:", error);
      toast.error("Failed to remove hotel brand");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences.preferredHotelBrands]);

  // Add custom preference
  const addCustomPreference = useCallback((pref: string) => {
    if (!pref.trim()) return;
    setPreferences(prev => ({
      ...prev,
      customPreferences: [...prev.customPreferences, pref.trim()]
    }));
    toast.success("Custom preference added");
  }, []);

  // Remove custom preference
  const removeCustomPreference = useCallback((pref: string) => {
    setPreferences(prev => ({
      ...prev,
      customPreferences: prev.customPreferences.filter(p => p !== pref)
    }));
    toast.success("Custom preference removed");
  }, []);


  // Toggle avoid-layovers
  const updateAvoidLayovers = useCallback(async (next: boolean) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ avoid_layovers: next, updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id);
      if (error) throw error;
      setPreferences(prev => ({ ...prev, avoidLayovers: next }));
      toast.success(next ? "Avoiding layovers" : "Layovers allowed");
    } catch (error) {
      console.error("Error updating avoid_layovers:", error);
      toast.error("Failed to update preference");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Set cost sensitivity (low/medium/high)
  const updateCostSensitivity = useCallback(async (next: CostSensitivity) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_preferences")
        .update({ cost_sensitivity: next, updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id);
      if (error) throw error;
      setPreferences(prev => ({ ...prev, costSensitivity: next }));
      toast.success(`Cost sensitivity: ${next}`);
    } catch (error) {
      console.error("Error updating cost_sensitivity:", error);
      toast.error("Failed to update preference");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  return {
    preferences,
    isLoading,
    isSaving,
    updateSeatPreference,
    updateMealPreference,
    addAirline,
    removeAirline,
    addHotelBrand,
    removeHotelBrand,
    addCustomPreference,
    removeCustomPreference,
    updateAvoidLayovers,
    updateCostSensitivity,
  };
}
