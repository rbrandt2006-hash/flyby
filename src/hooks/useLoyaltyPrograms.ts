import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LoyaltyProgram {
  id: string;
  kind: "airline" | "hotel";
  program_name: string;
  member_id: string | null;
}

const GUEST_KEY = "guest_loyalty_programs";
const isValidUuid = (v: string | undefined | null) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function readGuest(): LoyaltyProgram[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as LoyaltyProgram[]) : [];
  } catch {
    return [];
  }
}

function writeGuest(list: LoyaltyProgram[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function useLoyaltyPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const useGuest = !isValidUuid(user?.id);

  const load = useCallback(async () => {
    setIsLoading(true);
    if (useGuest) {
      setPrograms(readGuest());
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("loyalty_programs")
      .select("id, kind, program_name, member_id")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[loyalty] load failed", error);
      toast.error("Couldn't load loyalty programs");
      setPrograms([]);
    } else {
      setPrograms((data ?? []) as LoyaltyProgram[]);
    }
    setIsLoading(false);
  }, [useGuest, user]);

  useEffect(() => { void load(); }, [load]);

  const add = useCallback(async (input: Omit<LoyaltyProgram, "id">) => {
    setIsSaving(true);
    try {
      if (useGuest) {
        const next: LoyaltyProgram = { ...input, id: crypto.randomUUID() };
        const list = [...readGuest(), next];
        writeGuest(list);
        setPrograms(list);
        toast.success("Loyalty program added");
        return next;
      }
      const { data, error } = await supabase
        .from("loyalty_programs")
        .insert({ ...input, user_id: user!.id })
        .select("id, kind, program_name, member_id")
        .single();
      if (error) throw error;
      setPrograms(prev => [...prev, data as LoyaltyProgram]);
      toast.success("Loyalty program added");
      return data as LoyaltyProgram;
    } catch (e) {
      console.error(e);
      toast.error("Couldn't add program");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [useGuest, user]);

  const update = useCallback(async (id: string, patch: Partial<Omit<LoyaltyProgram, "id">>) => {
    setIsSaving(true);
    try {
      if (useGuest) {
        const list = readGuest().map(p => p.id === id ? { ...p, ...patch } : p);
        writeGuest(list);
        setPrograms(list);
        toast.success("Updated");
        return;
      }
      const { error } = await supabase
        .from("loyalty_programs")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
      toast.success("Updated");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't update program");
    } finally {
      setIsSaving(false);
    }
  }, [useGuest]);

  const remove = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      if (useGuest) {
        const list = readGuest().filter(p => p.id !== id);
        writeGuest(list);
        setPrograms(list);
        toast.success("Removed");
        return;
      }
      const { error } = await supabase.from("loyalty_programs").delete().eq("id", id);
      if (error) throw error;
      setPrograms(prev => prev.filter(p => p.id !== id));
      toast.success("Removed");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't remove program");
    } finally {
      setIsSaving(false);
    }
  }, [useGuest]);

  return { programs, isLoading, isSaving, add, update, remove, reload: load };
}
