"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type ClassActionResult = {
  error: string | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

export type CreateClassState = {
  error: string | null;
};

export async function createClassAction(
  _prevState: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  const t = await getTranslations("Classes");
  const name = ((formData.get("name") as string) ?? "").trim();

  if (!name) {
    return { error: t("genericError") };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .insert({ teacher_id: userId, name });

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function renameClassAction(
  classId: string,
  name: string
): Promise<ClassActionResult> {
  const t = await getTranslations("Classes");
  const trimmed = name.trim();

  if (!trimmed) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ name: trimmed })
    .eq("id", classId);

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function deleteClassAction(
  classId: string
): Promise<ClassActionResult> {
  const t = await getTranslations("Classes");

  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

/**
 * Sets the exact membership of a class to `studentIds`: inserts the
 * ones that were missing, removes the ones that were there but no
 * longer are. RLS ("owns_class" + "owns_student") is what actually
 * stops a teacher from linking someone else's class or student here.
 */
export async function updateClassMembershipAction(
  classId: string,
  studentIds: string[]
): Promise<ClassActionResult> {
  const t = await getTranslations("Classes");
  const supabase = await createClient();

  const { data: existingRows, error: fetchError } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId);

  if (fetchError) {
    return { error: t("genericError") };
  }

  const existingIds = new Set(
    (existingRows ?? []).map((row) => row.student_id as string)
  );
  const desiredIds = new Set(studentIds);

  const toAdd = studentIds.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("class_students")
      .insert(toAdd.map((studentId) => ({ class_id: classId, student_id: studentId })));

    if (error) {
      return { error: t("genericError") };
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("class_students")
      .delete()
      .eq("class_id", classId)
      .in("student_id", toRemove);

    if (error) {
      return { error: t("genericError") };
    }
  }

  return { error: null };
}
