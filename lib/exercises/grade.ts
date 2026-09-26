import type { BlankResult, Exercise } from "@/lib/exercises/types";

/**
 * Normaliza una respuesta para compararla: minúsculas, apóstrofes tipográficos
 * a "'", espacios colapsados y sin espacios pegados al apóstrofe, sin
 * puntuación final. NO quita los acentos: en italiano "e" y "è" son distintas.
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*'\s*/g, "'")
    .trim()
    .replace(/[.,;:!?]+$/, "")
    .trim();
}

/**
 * Corrige un ejercicio comparando con la solución ya generada (no llama a la
 * IA). `answers` trae, por id de hueco, lo que escribió el alumno (verbi y
 * estructural) o el índice de la opción elegida como texto (cloze).
 */
export function gradeExercise(
  exercise: Exercise,
  answers: Record<number, string>
): { results: BlankResult[]; correctCount: number } {
  const results = exercise.blanks.map((blank): BlankResult => {
    const raw = answers[blank.id] ?? "";

    if (exercise.type === "cloze") {
      const chosen = raw === "" ? NaN : Number(raw);
      return {
        id: blank.id,
        correct: Number.isInteger(chosen) && chosen === blank.correctIndex,
        studentAnswer: Number.isInteger(chosen) ? (blank.options[chosen] ?? "") : "",
      };
    }

    const student = normalizeAnswer(raw);
    const correct =
      student !== "" && blank.answers.some((a) => normalizeAnswer(a) === student);
    return { id: blank.id, correct, studentAnswer: raw.trim() };
  });

  return { results, correctCount: results.filter((r) => r.correct).length };
}
