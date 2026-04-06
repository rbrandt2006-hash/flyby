import { useState, useEffect, useCallback } from "react";

export interface TravelPreferences {
  prefersEarlyFlights: boolean;
  avoidsLayovers: boolean;
  costSensitive: boolean;
  flexibleTraveler: boolean;
  preferredAirlines: string[];
  preferredHotelBrands: string[];
  preferredSeatType: "window" | "aisle" | "any";
  budgetPerDay: number;
  lastUpdated: string;
}

interface PreferenceLearningData {
  earlyFlightBookings: number;
  lateFlightBookings: number;
  directFlightBookings: number;
  layoverFlightBookings: number;
  budgetOptionsChosen: number;
  premiumOptionsChosen: number;
  tripCount: number;
}

const PREFS_STORAGE_KEY = "flyby_travel_preferences";
const LEARNING_STORAGE_KEY = "flyby_learning_data";

const defaultPreferences: TravelPreferences = {
  prefersEarlyFlights: false,
  avoidsLayovers: false,
  costSensitive: false,
  flexibleTraveler: true,
  preferredAirlines: ["United Airlines", "Delta Air Lines"],
  preferredHotelBrands: ["Marriott", "Hilton"],
  preferredSeatType: "window",
  budgetPerDay: 300,
  lastUpdated: new Date().toISOString(),
};

const defaultLearningData: PreferenceLearningData = {
  earlyFlightBookings: 0,
  lateFlightBookings: 0,
  directFlightBookings: 0,
  layoverFlightBookings: 0,
  budgetOptionsChosen: 0,
  premiumOptionsChosen: 0,
  tripCount: 0,
};

function loadPreferences(): TravelPreferences {
  try {
    const stored = localStorage.getItem(PREFS_STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load preferences:", e);
  }
  return defaultPreferences;
}

function loadLearningData(): PreferenceLearningData {
  try {
    const stored = localStorage.getItem(LEARNING_STORAGE_KEY);
    if (stored) {
      return { ...defaultLearningData, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load learning data:", e);
  }
  return defaultLearningData;
}

function savePreferences(prefs: TravelPreferences) {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

function saveLearningData(data: PreferenceLearningData) {
  try {
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save learning data:", e);
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<TravelPreferences>(() => loadPreferences());
  const [learningData, setLearningData] = useState<PreferenceLearningData>(() => loadLearningData());

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    saveLearningData(learningData);
  }, [learningData]);

  // Infer preferences from learning data
  const inferPreferences = useCallback(() => {
    const updates: Partial<TravelPreferences> = {};
    
    // Early flights preference
    if (learningData.earlyFlightBookings + learningData.lateFlightBookings >= 3) {
      updates.prefersEarlyFlights = learningData.earlyFlightBookings > learningData.lateFlightBookings;
    }

    // Layover preference
    if (learningData.directFlightBookings + learningData.layoverFlightBookings >= 3) {
      updates.avoidsLayovers = learningData.directFlightBookings > learningData.layoverFlightBookings * 2;
    }

    // Cost sensitivity
    if (learningData.budgetOptionsChosen + learningData.premiumOptionsChosen >= 3) {
      updates.costSensitive = learningData.budgetOptionsChosen > learningData.premiumOptionsChosen;
    }

    // Flexible traveler (has made varied choices)
    updates.flexibleTraveler = 
      Math.abs(learningData.earlyFlightBookings - learningData.lateFlightBookings) < 3 &&
      Math.abs(learningData.budgetOptionsChosen - learningData.premiumOptionsChosen) < 3;

    if (Object.keys(updates).length > 0) {
      setPreferences((prev) => ({
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString(),
      }));
    }
  }, [learningData]);

  // Record a booking choice for learning
  const recordBookingChoice = useCallback((choice: {
    isEarlyFlight?: boolean;
    isDirect?: boolean;
    isBudgetOption?: boolean;
  }) => {
    setLearningData((prev) => {
      const updated = { ...prev, tripCount: prev.tripCount + 1 };
      
      if (choice.isEarlyFlight !== undefined) {
        if (choice.isEarlyFlight) {
          updated.earlyFlightBookings = prev.earlyFlightBookings + 1;
        } else {
          updated.lateFlightBookings = prev.lateFlightBookings + 1;
        }
      }

      if (choice.isDirect !== undefined) {
        if (choice.isDirect) {
          updated.directFlightBookings = prev.directFlightBookings + 1;
        } else {
          updated.layoverFlightBookings = prev.layoverFlightBookings + 1;
        }
      }

      if (choice.isBudgetOption !== undefined) {
        if (choice.isBudgetOption) {
          updated.budgetOptionsChosen = prev.budgetOptionsChosen + 1;
        } else {
          updated.premiumOptionsChosen = prev.premiumOptionsChosen + 1;
        }
      }

      return updated;
    });

    // Re-infer preferences after recording
    setTimeout(inferPreferences, 100);
  }, [inferPreferences]);

  // Get active preference labels for display
  const getActivePreferenceLabels = useCallback((): string[] => {
    const labels: string[] = [];
    
    if (preferences.prefersEarlyFlights) labels.push("Prefers early flights");
    if (preferences.avoidsLayovers) labels.push("Avoids layovers");
    if (preferences.costSensitive) labels.push("Cost-sensitive");
    if (preferences.flexibleTraveler) labels.push("Flexible traveler");
    if (preferences.preferredSeatType !== "any") {
      labels.push(`Prefers ${preferences.preferredSeatType} seat`);
    }

    return labels;
  }, [preferences]);

  // Check if we have enough data to show "based on past choices"
  const hasLearnedPreferences = useCallback(() => {
    return learningData.tripCount >= 2;
  }, [learningData]);

  // Update manual preference
  const updatePreference = useCallback(<K extends keyof TravelPreferences>(
    key: K,
    value: TravelPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  return {
    preferences,
    learningData,
    recordBookingChoice,
    getActivePreferenceLabels,
    hasLearnedPreferences,
    updatePreference,
    inferPreferences,
  };
}
