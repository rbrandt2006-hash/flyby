import { useEffect, useState } from "react";
import { backend, authedFetch } from "@/integrations/backend/client";
import type { TeamMember } from "@/components/team/TeamMemberCard";

/**
 * Real workspace teammates from the backend, with where each is traveling.
 *
 * `/api/team` returns the people in the caller's company plus each one's
 * soonest current-or-upcoming trip. This maps that into the `TeamMember` shape
 * the Team view renders, turning ISO trip dates into the display strings and
 * `Date` objects the status logic compares against.
 *
 * Returns an empty list for guests, personal (no-company) accounts, or when the
 * backend is unreachable — the Team page then decides whether to show demo data.
 */
export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!backend.getCurrentSession()) {
      setMembers([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await authedFetch("/api/team");
        if (!response.ok) {
          if (active) { setMembers([]); setLoading(false); }
          return;
        }
        const body = await response.json();
        const mapped = (body?.members ?? []).map(mapMember);
        if (active) { setMembers(mapped); setLoading(false); }
      } catch {
        if (active) { setMembers([]); setLoading(false); }
      }
    })();

    return () => { active = false; };
  }, []);

  return { members, loading };
}

interface BackendMember {
  id: string;
  name: string;
  role: string;
  team?: string;
  avatar?: string | null;
  isSelf?: boolean;
  trip?: { destination: string; startDate: string | null; endDate: string | null } | null;
}

function fmt(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function mapMember(m: BackendMember): TeamMember {
  const start = parseISO(m.trip?.startDate);
  const end = parseISO(m.trip?.endDate);

  const upcomingTrip =
    m.trip && start && end
      ? {
          destination: m.trip.destination,
          startDate: fmt(start),
          endDate: fmt(end),
          startAt: start,
          endAt: end,
        }
      : undefined;

  return {
    id: m.id,
    name: m.name,
    role: m.role,
    team: m.team || "Team",
    avatar: m.avatar || undefined,
    upcomingTrip,
  };
}
