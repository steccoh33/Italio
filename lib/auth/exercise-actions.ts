"use server";

import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { CorrectionRequestError } from "@/lib/ai/gemini-chain";
import { generateExercise } from "@/lib/ai/exercise-generator";
import { EXERCISE_TYPES, MAX_BLANKS, type ExerciseType } from "@/lib/exercises/config";
import type { Exercise } from "@/lib/exercises/types";

export type GenerateExerciseResult = {
  error: string | null;
  exercise: Exercise | null;
};

/** Genera un ejercicio del nivel del alumno (el nivel sale del perfil, no del navegador). */
export async function generateExerciseAction(
  type: ExerciseType
): Promise<GenerateExerciseResult> {
  const t = await getTranslations("Exercises");

  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel ||
    !EXERCISE_TYPES.includes(type)
  ) {
    return { error: t("genericError"), exercise: null };
  }

  try {
    const exercise = await generateExercise({ level: profile.targetLevel, type });
    return { error: null, exercise };
  } catch (err) {
    const busy = err instanceof CorrectionRequestError && err.kind === "busy";
    return { error: busy ? t("modelBusy") : t("genericError"), exercise: null };
  }
}

/** Registra el resultado de un intento (para las estadísticas). RLS asegura que sea del propio alumno. */
export async function recordAttemptAction(input: {
  type: ExerciseType;
  totalBlanks: number;
  correctCount: number;
}): Promise<{ error: string | null }> {
  const t = await getTranslations("Exercises");

  const profile = await getCurrentProfile();
  const { type, totalBlanks, correctCount } = input;
  if (
    !profile ||
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel ||
    !EXERCISE_TYPES.includes(type) ||
    !Number.isInteger(totalBlanks) ||
    !Number.isInteger(correctCount) ||
    totalBlanks < 1 ||
    totalBlanks > MAX_BLANKS ||
    correctCount < 0 ||
    correctCount > totalBlanks
  ) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exercise_attempts").insert({
    student_id: profile.userId,
    target_level: profile.targetLevel,
    exercise_type: type,
    total_blanks: totalBlanks,
    correct_count: correctCount,
  });

  return { error: error ? t("genericError") : null };
}
