import { useCallback } from "react";
import { useBackendCollection } from "./useBackendCollection";

export interface ClientCompany {
  id: string;
  name: string;
  industry?: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = "flyby_client_companies";
const SEED_KEY = "flyby_client_companies_seeded_v1";

function seedCompanies(): ClientCompany[] {
  const now = new Date().toISOString();
  return [
    { id: "co_acme", name: "Acme Corp", industry: "Manufacturing", createdAt: now },
    { id: "co_globex", name: "Globex Inc.", industry: "Logistics", createdAt: now },
    { id: "co_initech", name: "Initech", industry: "Software", createdAt: now },
    { id: "co_umbrella", name: "Umbrella Health", industry: "Healthcare", createdAt: now },
    { id: "co_stark", name: "Stark Industries", industry: "Aerospace", createdAt: now },
  ];
}

export function useCompanies() {
  // The client companies a traveler visits, stored per user in the backend.
  const [companies, setCompanies] = useBackendCollection<ClientCompany[]>({
    endpoint: "client-companies",
    payloadKey: "companies",
    cacheKey: STORAGE_KEY,
    initial: [],
    seed: seedCompanies,
    isEmpty: (rows) => !Array.isArray(rows) || rows.length === 0,
  });

  const addCompany = useCallback((name: string, extra?: Partial<ClientCompany>): ClientCompany => {
    const trimmed = name.trim();
    const existing = companies.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const company: ClientCompany = {
      id: `co_${Date.now()}`,
      name: trimmed,
      industry: extra?.industry,
      notes: extra?.notes,
      createdAt: new Date().toISOString(),
    };
    setCompanies((prev) => [...prev, company]);
    return company;
  }, [companies]);

  const getCompany = useCallback(
    (id?: string | null) => (id ? companies.find((c) => c.id === id) ?? null : null),
    [companies],
  );

  return { companies, addCompany, getCompany };
}
