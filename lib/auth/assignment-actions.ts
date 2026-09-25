"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type AssignmentActionResult = {
  error: string | null;
};

export type AssignmentInput = {
  title: string;
  instructions: string;
  /** ISO 8601, o null si no hay fecha límite. */
  dueDate: string | null;
};

function normalize(input: AssignmentInput) {
  const title = input.title.trim();
  const instructions = input.instructions.trim();
  const due =
    input.dueDate && !Number.isNaN(Date.parse(input.dueDate))
      ? new Date(input.dueDate).toISOString()
      : null;
  return { title, instructions, due };
}

/**
 * Crea una tarea en una clase. RLS ("crea tareas en sus propias clases")
 * es lo que impide asignarla a la clase de otro profesor.
 */
export async function createAssignmentAction(
  classId: string,
  input: AssignmentInput
): Promise<AssignmentActionResult> {
  const t = await getTranslations("Assignments");
  const { title, instructions, due } = normalize(input);

  if (!title || !instructions) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) {
    return { error: t("genericError") };
  }

  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    teacher_id: userId,
    title,
    instructions,
    due_date: due,
  });

  if (error) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function updateAssignmentAction(
  assignmentId: string,
  input: AssignmentInput
): Promise<AssignmentActionResult> {
  const t = await getTranslations("Assignments");
  const { title, instructions, due } = normalize(input);

  if (!title || !instructions) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .update({ title, instructions, due_date: due })
    .eq("id", assignmentId)
    .select("id");

  // RLS filters rows silently: no error but no row means it isn't theirs.
  if (error || !data || data.length === 0) {
    return { error: t("genericError") };
  }

  return { error: null };
}

export async function deleteAssignmentAction(
  assignmentId: string
): Promise<AssignmentActionResult> {
  const t = await getTranslations("Assignments");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId)
    .select("id");

  if (error || !data || data.length === 0) {
    return { error: t("genericError") };
  }

  return { error: null };
}
