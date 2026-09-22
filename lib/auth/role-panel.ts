import type { UserRole } from "@/lib/types/profile";

/**
 * Where an active user's own panel lives, by role. `null`/missing means
 * that role doesn't have a panel yet — it stays on the generic welcome
 * screen at /panel until one is built.
 */
const ROLE_PANEL_HREF: Partial<Record<UserRole, string>> = {
  admin: "/admin",
  // teacher: "/panel/teacher" — próxima etapa
  // student: "/panel/student" — próxima etapa
};

export function getRolePanelHref(role: UserRole): string | null {
  return ROLE_PANEL_HREF[role] ?? null;
}
