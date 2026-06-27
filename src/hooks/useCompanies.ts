import { useCallback, useEffect, useState } from "react";

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

function load(): ClientCompany[] {
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      const seeded = seedCompanies();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(SEED_KEY, "true");
      return seeded;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClientCompany[]) : [];
  } catch {
    return [];
  }
}

function save(list: ClientCompany[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function useCompanies() {
  const [companies, setCompanies] = useState<ClientCompany[]>(() => load());

  useEffect(() => {
    save(companies);
  }, [companies]);

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
