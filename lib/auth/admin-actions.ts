"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { UserStatus } from "@/lib/types/profile";

export type AdminActionResult = {
  error: string | null;
};

/**
 * Sets the status of one or more teacher profiles. Relies on RLS
 * ("El admin activo puede cambiar el status de un profesor") to
 * actually gate who's allowed to do this — this action doesn't
 * re-check the role itself, it just performs the update as the
 * logged-in user and reports back whatever Postgres/RLS decided.
 */
export async function updateTeacherStatusAction(
  teacherIds: string[],
  status: UserStatus
): Promise<AdminActionResult> {
  if (teacherIds.length === 0) {
    return { error: null };
  }

  const t = await getTranslations("Admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .in("id", teacherIds)
    .eq("role", "teacher");

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function deleteTeachersAction(
  teacherIds: string[]
): Promise<AdminActionResult> {
  if (teacherIds.length === 0) {
    return { error: null };
  }

  const t = await getTranslations("Admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .in("id", teacherIds)
    .eq("role", "teacher");

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}
