import type { LocalTrip } from "@/hooks/useTrips";

export interface TravelPolicy {
  id?: string;
  company_id?: string | null;
  max_nightly_hotel_rate: number | null;
  max_flight_price: number | null;
  max_flight_class: "economy" | "premium_economy" | "business" | "first" | null;
  approval_required_above: number | null;
}

export type PolicyStatus = "compliant" | "over-budget" | "needs-approval" | "no-policy";

export interface PolicyEvaluation {
  status: PolicyStatus;
  label: string;
  reasons: string[];
  score: number; // 0-100, used for AIReasoningPanel display
  detail: string;
}

const FLIGHT_CLASS_RANK: Record<string, number> = {
  economy: 1,
  premium_economy: 2,
  business: 3,
  first: 4,
};

function normalizeCabin(input?: string | null): string | null {
  if (!input) return null;
  const k = input.toLowerCase().replace(/\s|-/g, "_");
  if (k.includes("first")) return "first";
  if (k.includes("business")) return "business";
  if (k.includes("premium")) return "premium_economy";
  if (k.includes("econom")) return "economy";
  return null;
}

export const FLIGHT_CLASS_LABEL: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
};

interface TripLike {
  estimatedCost?: number;
  flight?: { cabinClass?: string | null; price?: number | null } | null;
  hotel?: { pricePerNight?: number | null } | null;
  startDate?: string;
  endDate?: string;
}

export function evaluatePolicy(
  trip: TripLike | LocalTrip,
  policy: TravelPolicy | null
): PolicyEvaluation {
  if (!policy || (
    policy.max_nightly_hotel_rate == null &&
    policy.max_flight_price == null &&
    policy.max_flight_class == null &&
    policy.approval_required_above == null
  )) {
    return {
      status: "no-policy",
      label: "No policy",
      reasons: ["No company travel policy configured"],
      score: 75,
      detail: "No company travel policy configured",
    };
  }

  const violations: string[] = [];
  const approvalReasons: string[] = [];

  // Nightly hotel rate
  const ppn = (trip.hotel as any)?.pricePerNight;
  if (policy.max_nightly_hotel_rate != null && ppn != null && ppn > policy.max_nightly_hotel_rate) {
    violations.push(`Hotel $${ppn}/night exceeds $${policy.max_nightly_hotel_rate}/night limit`);
  }

  // Flight price
  const fp = (trip.flight as any)?.price;
  if (policy.max_flight_price != null && fp != null && fp > policy.max_flight_price) {
    violations.push(`Flight $${fp} exceeds $${policy.max_flight_price} limit`);
  }

  // Flight class
  const cabin = normalizeCabin((trip.flight as any)?.cabinClass);
  if (policy.max_flight_class && cabin && FLIGHT_CLASS_RANK[cabin] > FLIGHT_CLASS_RANK[policy.max_flight_class]) {
    violations.push(`${FLIGHT_CLASS_LABEL[cabin]} exceeds allowed ${FLIGHT_CLASS_LABEL[policy.max_flight_class]}`);
  }

  // Pre-trip approval threshold
  const total = (trip as any).estimatedCost ?? 0;
  if (policy.approval_required_above != null && total > policy.approval_required_above) {
    approvalReasons.push(`Trip total $${total.toLocaleString()} exceeds $${policy.approval_required_above.toLocaleString()} approval threshold`);
  }

  if (violations.length > 0) {
    return {
      status: "over-budget",
      label: "Over budget",
      reasons: [...violations, ...approvalReasons],
      score: 30,
      detail: violations[0],
    };
  }
  if (approvalReasons.length > 0) {
    return {
      status: "needs-approval",
      label: "Needs approval",
      reasons: approvalReasons,
      score: 65,
      detail: approvalReasons[0],
    };
  }
  return {
    status: "compliant",
    label: "Compliant",
    reasons: ["Within all policy limits"],
    score: 100,
    detail: "Within all policy limits",
  };
}
