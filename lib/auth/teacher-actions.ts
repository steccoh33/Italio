"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { UserStatus } from "@/lib/types/profile";

export type TeacherActionResult = {
  error: string | null;
};

/**
 * Sets the status of one or more of the current user's students.
 * Relies on RLS ("El profesor activo puede cambiar el status de sus
 * alumnos") to gate this: a teacher/admin can only ever affect rows
 * where teacher_id = their own id, never another teacher's students.
 */
export async function updateStudentStatusAction(
  studentIds: string[],
  status: UserStatus
): Promise<TeacherActionResult> {
  if (studentIds.length === 0) {
    return { error: null };
  }

  const t = await getTranslations("Teacher");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .in("id", studentIds)
    .eq("role", "student");

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function deleteStudentsAction(
  studentIds: string[]
): Promise<TeacherActionResult> {
  if (studentIds.length === 0) {
    return { error: null };
  }

  const t = await getTranslations("Teacher");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .in("id", studentIds)
    .eq("role", "student");

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}
