import type { ExerciseType } from "@/lib/exercises/config";

export type ExerciseBlank = {
  id: number;
  /** Etiqueta de la estructura que evalúa este hueco (validada contra la ficha del nivel). */
  structure: string;
  /** Formas correctas aceptadas (verbi/strutturale). */
  answers: string[];
  /** Opciones (cloze). */
  options: string[];
  /** Índice de la opción correcta (cloze). */
  correctIndex: number;
  /** Explicación breve, en italiano. */
  explanation: string;
};

export type Exercise = {
  type: ExerciseType;
  /** Consigna para el alumno, en italiano. */
  instructions: string;
  /** Texto con marcadores [1], [2]... en cada hueco. */
  text: string;
  blanks: ExerciseBlank[];
};

export type BlankResult = {
  id: number;
  correct: boolean;
  studentAnswer: string;
};
