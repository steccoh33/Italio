import {
  LEVEL_CONFIG,
  MAX_BLANKS,
  MIN_BLANKS,
  allowedStructures,
  type ExerciseType,
} from "@/lib/exercises/config";
import { normalizeAnswer } from "@/lib/exercises/grade";
import type { Exercise, ExerciseBlank } from "@/lib/exercises/types";
import type { CilsLevel } from "@/lib/types/profile";

type Result = { ok: true; exercise: Exercise } | { ok: false; reason: string };

/** Formas de congiuntivo imperfetto/trapassato frecuentes: por debajo de B2 no deben aparecer en NINGUNA parte del texto. */
const SUBJUNCTIVE_FORMS =
  /\b(avesse|avessero|avessi|avessimo|fosse|fossero|fossi|fossimo|facesse|facessero|facessi|potesse|potessero|volesse|volessero|dovesse|dovessero|dicesse|dicessero|stesse|stessero|desse|dessero|sapesse|sapessero|andasse|andassero|venisse|venissero|uscisse|capisse|finisse|partisse|mangiasse|parlasse|lavorasse|prendesse|vedesse|leggesse|scrivesse|arrivasse|tornasse|trovasse|piovesse)\b/i;

/** Congiuntivo presente tras "che" (p. ej. "che sia", "che vada"): tampoco debe aparecer por debajo de B2. */
const PRESENT_SUBJUNCTIVE_AFTER_CHE =
  /\bche\s+(?:tu\s+|lui\s+|lei\s+|io\s+)?(sia|siano|abbia|abbiano|faccia|facciano|vada|vadano|possa|possano|voglia|vogliano|debba|debbano|dica|dicano|stia|stiano|dia|diano|sappia|sappiano|venga|vengano|esca|escano|capisca|finisca|parta|prenda|veda|legga|scriva|arrivi|torni|trovi|piova)\b/i;

const LEVELS_BELOW_B2: CilsLevel[] = ["A1", "A2", "B1"];

const fail = (reason: string): Result => ({ ok: false, reason });

function normalizeStructure(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : "";
}

/**
 * Valida y limpia la respuesta de la IA. Rechaza todo lo que no sea un ejercicio
 * bien formado y DENTRO del nivel: cada hueco declara su estructura y esa
 * etiqueta debe estar en la ficha del nivel (p. ej. un B1 no puede traer
 * "congiuntivo_presente").
 */
export function validateExercise(
  raw: unknown,
  level: CilsLevel,
  type: ExerciseType
): Result {
  if (typeof raw !== "object" || raw === null) return fail("no es un objeto");
  const value = raw as Record<string, unknown>;

  const instructions =
    typeof value.instructions === "string" ? value.instructions.trim() : "";
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!instructions) return fail("falta instructions");
  if (!text) return fail("falta text");
  if (!Array.isArray(value.blanks)) return fail("falta blanks");

  if (LEVELS_BELOW_B2.includes(level)) {
    const hit = text.match(SUBJUNCTIVE_FORMS) ?? text.match(PRESENT_SUBJUNCTIVE_AFTER_CHE);
    if (hit) return fail(`el texto contiene congiuntivo ("${hit[0]}") por encima del nivel ${level}`);
  }

  const blanksRaw = value.blanks as Record<string, unknown>[];
  if (blanksRaw.length < MIN_BLANKS || blanksRaw.length > MAX_BLANKS) {
    return fail(`cantidad de huecos inválida: ${blanksRaw.length}`);
  }

  const allowed = new Set(allowedStructures(level, type));
  const expectedOptions = LEVEL_CONFIG[level].clozeOptions;
  const blanks: ExerciseBlank[] = [];
  const seenIds = new Set<number>();

  for (const item of blanksRaw) {
    const id = item.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
      return fail("id de hueco inválido");
    }
    if (seenIds.has(id)) return fail(`id repetido: ${id}`);
    seenIds.add(id);

    const occurrences = text.split(`[${id}]`).length - 1;
    if (occurrences !== 1) return fail(`el marcador [${id}] aparece ${occurrences} veces`);

    const structure = normalizeStructure(item.structure);
    if (!allowed.has(structure)) {
      return fail(`estructura fuera del nivel ${level}: "${structure}" (hueco ${id})`);
    }

    const explanation =
      typeof item.explanation === "string" ? item.explanation.trim() : "";
    if (!explanation) return fail(`falta explicación (hueco ${id})`);

    const answersRaw = Array.isArray(item.answers) ? item.answers : [];
    const optionsRaw = Array.isArray(item.options) ? item.options : [];

    if (type === "cloze") {
      const options = optionsRaw
        .filter((o): o is string => typeof o === "string")
        .map((o) => o.trim());
      if (options.length !== expectedOptions || options.some((o) => o === "")) {
        return fail(`el hueco ${id} debe tener ${expectedOptions} opciones`);
      }
      if (new Set(options.map(normalizeAnswer)).size !== options.length) {
        return fail(`opciones repetidas (hueco ${id})`);
      }
      const correctIndex = item.correct_index;
      if (
        typeof correctIndex !== "number" ||
        !Number.isInteger(correctIndex) ||
        correctIndex < 0 ||
        correctIndex >= options.length
      ) {
        return fail(`correct_index inválido (hueco ${id})`);
      }
      blanks.push({ id, structure, answers: [], options, correctIndex, explanation });
    } else {
      const answers = [
        ...new Set(
          answersRaw
            .filter((a): a is string => typeof a === "string")
            .map((a) => a.trim())
            .filter((a) => a !== "")
        ),
      ];
      if (answers.length < 1 || answers.length > 4) {
        return fail(`respuestas inválidas (hueco ${id})`);
      }
      if (type === "verbi" && !new RegExp(`\\[${id}\\]\\s*\\(`).test(text)) {
        return fail(`falta el infinitivo entre paréntesis después de [${id}]`);
      }
      blanks.push({ id, structure, answers, options: [], correctIndex: 0, explanation });
    }
  }

  // Every marker in the text must belong to a declared blank.
  const markers = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  if (markers.some((m) => !seenIds.has(m))) return fail("marcador sin hueco declarado");

  blanks.sort((a, b) => a.id - b.id);
  return { ok: true, exercise: { type, instructions, text, blanks } };
}

/** Un participio suelto ("cominciato") no es una respuesta completa de un tiempo compuesto. */
export function isBarePastParticiple(answer: string): boolean {
  const words = normalizeAnswer(answer).split(" ");
  return words.length === 1 && /(ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite)$/.test(words[0]);
}

export type TestedForm = { structure: string; form: string; isCorrect: boolean };

export type VerifierBlank = {
  id: number;
  structure: string;
  answers: string[];
  validOptionIndices: number[];
  explanation: string;
};

/**
 * Parsea la respuesta del verificador (un segundo pase de IA que resolvió el
 * ejercicio SIN ver la solución) a una lista limpia. Devuelve null si está mal formada.
 */
export function parseVerifierOutput(
  raw: unknown
): { blanks: VerifierBlank[]; textAboveLevel: string[] } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const blanks = (raw as Record<string, unknown>).blanks;
  if (!Array.isArray(blanks)) return null;
  const aboveRaw = (raw as Record<string, unknown>).text_above_level;
  const textAboveLevel = Array.isArray(aboveRaw)
    ? aboveRaw.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
    : [];

  const out: VerifierBlank[] = [];
  for (const item of blanks as Record<string, unknown>[]) {
    if (typeof item?.id !== "number" || !Number.isInteger(item.id)) return null;
    const strings = (v: unknown) =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];
    const indices = Array.isArray(item.valid_option_indices)
      ? item.valid_option_indices.filter((x): x is number => Number.isInteger(x))
      : [];
    // Forms the verifier explicitly tested and judged correct count as answers too.
    const tested: TestedForm[] = Array.isArray(item.tested_forms)
      ? (item.tested_forms as Record<string, unknown>[])
          .filter((t) => typeof t?.form === "string" && typeof t?.is_correct === "boolean")
          .map((t) => ({
            structure: normalizeStructure(t.structure),
            form: (t.form as string).trim(),
            isCorrect: t.is_correct as boolean,
          }))
      : [];
    const testedCorrect = tested.filter((t) => t.isCorrect && t.form !== "").map((t) => t.form);
    out.push({
      id: item.id,
      structure: normalizeStructure(item.structure),
      answers: [...new Set([...strings(item.answers), ...testedCorrect])],
      validOptionIndices: indices,
      explanation: typeof item.explanation === "string" ? item.explanation.trim() : "",
    });
  }
  return { blanks: out, textAboveLevel };
}

/**
 * Cruza el ejercicio del generador con la resolución independiente del
 * verificador. Cada hueco debe cumplir:
 *  - verbi/estructural: las respuestas de ambos se solapan (si no, el hueco es
 *    dudoso). Se aceptan las de los dos (unión): mejor no marcar mal una
 *    respuesta correcta. La estructura que el verificador ve debe ser del nivel.
 *  - cloze: el verificador ve exactamente UNA opción correcta y es la misma.
 * Si algún hueco falla, se rechaza el ejercicio entero (se regenera).
 */
export function mergeVerification(
  exercise: Exercise,
  verifier: VerifierBlank[],
  level: CilsLevel
): Result {
  const allowed = new Set(allowedStructures(level, exercise.type));
  const blanks: ExerciseBlank[] = [];

  for (const blank of exercise.blanks) {
    const v = verifier.find((x) => x.id === blank.id);
    if (!v) return fail(`el verificador no resolvió el hueco ${blank.id}`);

    if (!allowed.has(v.structure)) {
      return fail(`el verificador ubica el hueco ${blank.id} fuera del nivel: "${v.structure}"`);
    }

    if (exercise.type === "cloze") {
      const only = v.validOptionIndices;
      if (only.length !== 1 || only[0] !== blank.correctIndex) {
        return fail(`cloze dudoso en el hueco ${blank.id}`);
      }
      blanks.push({ ...blank, explanation: v.explanation || blank.explanation });
      continue;
    }

    const generatorSet = new Set(blank.answers.map(normalizeAnswer));
    const overlap = v.answers.some((a) => generatorSet.has(normalizeAnswer(a)));
    if (!overlap) return fail(`las respuestas del hueco ${blank.id} no coinciden con el verificador`);

    const merged = [...blank.answers];
    for (const answer of v.answers) {
      if (!merged.some((m) => normalizeAnswer(m) === normalizeAnswer(answer))) {
        merged.push(answer);
      }
    }
    // Incomplete forms (a lone participle) must never be accepted as an answer.
    const complete = exercise.type === "verbi" ? merged.filter((a) => !isBarePastParticiple(a)) : merged;
    if (complete.length === 0) return fail(`el hueco ${blank.id} solo tiene respuestas incompletas`);
    blanks.push({
      ...blank,
      answers: complete,
      explanation: v.explanation || blank.explanation,
    });
  }

  return { ok: true, exercise: { ...exercise, blanks } };
}
