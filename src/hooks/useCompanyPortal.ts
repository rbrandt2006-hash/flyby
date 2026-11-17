import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCompany, type CompanyState } from "@/services/companyPortal";

/**
 * The traveler's company portal, shared by every component that shows it.
 *
 * The navigation, Settings and the company page all need it at once; one
 * request serves them all, and a change anywhere (joining, leaving, a new
 * request) refreshes every copy.
 */

const CHANGE_EVENT = "flyby:company-changed";
let cache: { userId: string; state: CompanyState | null } | null = null;
let inFlight: Promise<CompanyState | null> | null = null;

function load(userId: string, force = false): Promise<CompanyState | null> {
  if (!force && cache?.userId === userId) return Promise.resolve(cache.state);
  if (!force && inFlight) return inFlight;
  inFlight = getCompany()
    .then((state) => {
      cache = { userId, state };
      return state;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Tell every mounted copy that the company changed. */
export function announceCompanyChange(state?: CompanyState | null) {
  if (state !== undefined && cache) cache = { ...cache, state };
  else cache = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useCompanyPortal() {
  const { user, isGuest } = useAuth();
  const userId = user?.id && !isGuest ? user.id : null;
  const [state, setState] = useState<CompanyState | null>(() => (userId && cache?.userId === userId ? cache.state : null));
  const [loading, setLoading] = useState(() => Boolean(userId) && cache?.userId !== userId);

  const refresh = useCallback(async (force = true) => {
    if (!userId) {
      setState(null);
      setLoading(false);
      return null;
    }
    const next = await load(userId, force);
    setState(next);
    setLoading(false);
    return next;
  }, [userId]);

  useEffect(() => {
    void refresh(false);
    const onChange = () => { void refresh(cache === null); };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, [refresh]);

  return {
    state,
    loading,
    portal: state?.portal ?? null,
    role: state?.role ?? null,
    request: state?.request ?? null,
    /** A company admin of a verified portal: sees members' trips and expenses. */
    isCompanyAdmin: state?.role === "admin" && Boolean(state?.portal),
    refresh,
  };
}
