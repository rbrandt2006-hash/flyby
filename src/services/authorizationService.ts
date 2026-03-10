import { supabase } from "@/integrations/supabase/client";

/**
 * Authorization middleware service.
 * Checks permissions, tenant status, and enforces object-level access.
 */

/**
 * Checks if the current user has a specific permission.
 * Uses the has_permission database function for server-side validation.
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: user.id,
    _permission: permission,
  });

  if (error) {
    console.warn("[authz] Permission check failed:", error.message);
    return false;
  }

  return data === true;
}

/**
 * Validates that the current user's tenant is active.
 * Returns false if tenant is suspended or deleted.
 */
export async function validateTenantStatus(): Promise<{ valid: boolean; status?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { valid: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return { valid: false, status: "no_tenant" };

  const { data: company } = await supabase
    .from("companies")
    .select("status")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (!company) return { valid: false, status: "not_found" };

  const status = (company as any).status ?? "active";
  return {
    valid: status === "active",
    status,
  };
}

/**
 * Validates that an object belongs to the current user's tenant.
 * Prevents cross-tenant data access by verifying company_id match.
 */
export async function validateObjectOwnership(
  table: string,
  objectId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return false;

  // Use typed queries for known tables
  const tablesWithCompanyId = ["trips", "expenses", "messages", "documents"] as const;
  if (!tablesWithCompanyId.includes(table as any)) return false;

  const { data, error } = await (supabase.from(table as any) as any)
    .select("company_id, user_id")
    .eq("id", objectId)
    .maybeSingle();

  if (error || !data) return false;

  // Object must belong to same company OR be owned by the user
  return data.company_id === profile.company_id || data.user_id === user.id;
}

/**
 * Gets all permissions for the current user based on their role.
 */
export async function getUserPermissions(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = userRole?.role ?? "user";

  const { data: rolePerms } = await (supabase.from("role_permissions") as any)
    .select("permission_id, permissions(name)")
    .eq("role", role);

  if (!rolePerms) return [];
  return rolePerms.map((rp: any) => rp.permissions?.name).filter(Boolean);
}

/**
 * Determines if a sensitive action requires step-up authentication.
 */
export function requiresStepUpAuth(action: string): boolean {
  const sensitiveActions = [
    "expense.approve",
    "user.manage",
    "tenant.settings",
    "report.generate",
    "file.delete",
  ];
  return sensitiveActions.includes(action);
}

/**
 * Permission cache for the current session to avoid repeated DB calls.
 */
let permissionCache: { permissions: string[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCachedPermissions(): Promise<string[]> {
  if (permissionCache && Date.now() - permissionCache.timestamp < CACHE_TTL_MS) {
    return permissionCache.permissions;
  }

  const permissions = await getUserPermissions();
  permissionCache = { permissions, timestamp: Date.now() };
  return permissions;
}

export function clearPermissionCache(): void {
  permissionCache = null;
}
