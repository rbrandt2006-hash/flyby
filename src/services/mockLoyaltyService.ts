// Deterministic mocked balance/tier data for loyalty programs.
// Gated by the global Demo Data toggle on display.

export interface LoyaltyTier {
  name: string;
  threshold: number; // points needed to reach this tier
}

const AIRLINE_TIERS: LoyaltyTier[] = [
  { name: "Member", threshold: 0 },
  { name: "Silver", threshold: 25_000 },
  { name: "Gold", threshold: 50_000 },
  { name: "Platinum", threshold: 75_000 },
  { name: "1K / Executive", threshold: 100_000 },
];

const HOTEL_TIERS: LoyaltyTier[] = [
  { name: "Member", threshold: 0 },
  { name: "Silver", threshold: 10 },
  { name: "Gold", threshold: 25 },
  { name: "Platinum", threshold: 50 },
  { name: "Diamond", threshold: 75 },
];

export interface MockedLoyaltyStats {
  unit: "miles" | "points" | "nights";
  balance: number;
  tier: string;
  nextTier: string | null;
  toNextTier: number; // amount needed to reach next tier
  progressPct: number; // 0-100 within current tier
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getMockedStats(kind: "airline" | "hotel", programName: string): MockedLoyaltyStats {
  const seed = hash(programName);
  if (kind === "airline") {
    // Balance between 5k and 125k miles
    const balance = 5_000 + (seed % 120_000);
    const tierIdx = AIRLINE_TIERS.findIndex((t, i) =>
      balance >= t.threshold &&
      (i === AIRLINE_TIERS.length - 1 || balance < AIRLINE_TIERS[i + 1].threshold)
    );
    const current = AIRLINE_TIERS[tierIdx];
    const next = AIRLINE_TIERS[tierIdx + 1] ?? null;
    const span = next ? next.threshold - current.threshold : 1;
    const into = balance - current.threshold;
    return {
      unit: "miles",
      balance,
      tier: current.name,
      nextTier: next?.name ?? null,
      toNextTier: next ? next.threshold - balance : 0,
      progressPct: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
    };
  }
  // Hotel: points + nights-driven tier
  const balance = 8_000 + (seed % 90_000);
  const nights = 2 + (seed % 80);
  const tierIdx = HOTEL_TIERS.findIndex((t, i) =>
    nights >= t.threshold &&
    (i === HOTEL_TIERS.length - 1 || nights < HOTEL_TIERS[i + 1].threshold)
  );
  const current = HOTEL_TIERS[tierIdx];
  const next = HOTEL_TIERS[tierIdx + 1] ?? null;
  const span = next ? next.threshold - current.threshold : 1;
  const into = nights - current.threshold;
  return {
    unit: "points",
    balance,
    tier: current.name,
    nextTier: next?.name ?? null,
    toNextTier: next ? next.threshold - nights : 0,
    progressPct: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
  };
}

// Rough conversion: miles/points to USD redemption value for upgrade suggestions
export function pointsToUsd(kind: "airline" | "hotel", points: number): number {
  const rate = kind === "airline" ? 0.014 : 0.007; // industry-average cents/point
  return Math.round(points * rate);
}
