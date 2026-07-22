import { useState, useEffect, useCallback } from "react";
import { backend } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TravelPolicy } from "@/services/policyEvaluator";

const GUEST_KEY = "flyby_travel_policy_guest";

const EMPTY: TravelPolicy = {
  max_nightly_hotel_rate: null,
  max_flight_price: null,
  max_flight_class: null,
  approval_required_above: null,
};

function loadGuest(): TravelPolicy {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return EMPTY;
}

export function useTravelPolicy() {
  const { user, isGuest } = useAuth();
  const [policy, setPolicy] = useState<TravelPolicy>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isGuest || !user) {
        setPolicy(loadGuest());
        return;
      }
      // Get company id
      const { data: prof } = await backend
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const cid = prof?.company_id ?? null;
      setCompanyId(cid);
      if (!cid) {
        setPolicy(EMPTY);
        return;
      }
      const { data } = await backend
        .from("travel_policies")
        .select("*")
        .eq("company_id", cid)
        .maybeSingle();
      if (data) {
        setPolicy({
          id: data.id,
          company_id: data.company_id,
          max_nightly_hotel_rate: data.max_nightly_hotel_rate as number | null,
          max_flight_price: data.max_flight_price as number | null,
          max_flight_class: data.max_flight_class as TravelPolicy["max_flight_class"],
          approval_required_above: data.approval_required_above as number | null,
        });
      } else {
        setPolicy(EMPTY);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (updates: Partial<TravelPolicy>) => {
    setSaving(true);
    try {
      const next = { ...policy, ...updates };
      if (isGuest || !user) {
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        setPolicy(next);
        return { error: null };
      }
      if (!companyId) return { error: new Error("No company associated with this account") };
      const payload = {
        company_id: companyId,
        max_nightly_hotel_rate: next.max_nightly_hotel_rate,
        max_flight_price: next.max_flight_price,
        max_flight_class: next.max_flight_class,
        approval_required_above: next.approval_required_above,
      };
      const { data, error } = await backend
        .from("travel_policies")
        .upsert(payload, { onConflict: "company_id" })
        .select()
        .maybeSingle();
      if (error) return { error };
      if (data) {
        setPolicy({
          id: data.id,
          company_id: data.company_id,
          max_nightly_hotel_rate: data.max_nightly_hotel_rate as number | null,
          max_flight_price: data.max_flight_price as number | null,
          max_flight_class: data.max_flight_class as TravelPolicy["max_flight_class"],
          approval_required_above: data.approval_required_above as number | null,
        });
      }
      return { error: null };
    } finally {
      setSaving(false);
    }
  }, [policy, user, isGuest, companyId]);

  return { policy, loading, saving, save, reload: load };
}
