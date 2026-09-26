"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  generateExerciseAction,
  recordAttemptAction,
} from "@/lib/auth/exercise-actions";
import { gradeExercise } from "@/lib/exercises/grade";
import {
  EXERCISE_TYPES,
  type ExerciseType,
  type StructuralKind,
} from "@/lib/exercises/config";
import type { BlankResult, Exercise } from "@/lib/exercises/types";
import { Button } from "@/components/ui/button";

/** Parte el texto en trozos de texto y marcadores [n]. */
function splitText(text: string): ({ kind: "text"; value: string } | { kind: "blank"; id: number })[] {
  const parts: ({ kind: "text"; value: string } | { kind: "blank"; id: number })[] = [];
  let last = 0;
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    if (match.index > last) parts.push({ kind: "text", value: text.slice(last, match.index) });
    parts.push({ kind: "blank", id: Number(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

function AutoCorrectNotice({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amarillo/40 bg-amarillo/10 px-3 py-2 text-xs text-foreground">
      <span
        aria-hidden="true"
        className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-amarillo text-[10px] font-bold text-tinta"
      >
        i
      </span>
      <span>{text}</span>
    </p>
  );
}

export function StructureExercises({
  levelLabel,
  structuralKind,
}: {
  levelLabel: string;
  structuralKind: StructuralKind;
}) {
  const t = useTranslations("Exercises");
  const [type, setType] = useState<ExerciseType | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<BlankResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const graded = results !== null;

  function generate(nextType: ExerciseType) {
    setType(nextType);
    setExercise(null);
    setAnswers({});
    setResults(null);
    setError(null);
    startTransition(async () => {
      const result = await generateExerciseAction(nextType);
      if (result.error || !result.exercise) {
        setError(result.error);
        return;
      }
      setExercise(result.exercise);
    });
  }

  function handleCheck() {
    if (!exercise || graded) return;
    const { results: graderResults, correctCount } = gradeExercise(exercise, answers);
    setResults(graderResults);
    void recordAttemptAction({
      type: exercise.type,
      totalBlanks: exercise.blanks.length,
      correctCount,
    });
  }

  function reset() {
    setType(null);
    setExercise(null);
    setAnswers({});
    setResults(null);
    setError(null);
  }

  const typeName = (value: ExerciseType) =>
    value === "strutturale" ? t(`kind.${structuralKind}.name`) : t(`type.${value}.name`);
  const typeDesc = (value: ExerciseType) =>
    value === "strutturale" ? t(`kind.${structuralKind}.desc`) : t(`type.${value}.desc`);

  if (!type) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("chooseType", { level: levelLabel })}
        </p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {EXERCISE_TYPES.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => generate(value)}
                className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-azul"
              >
                <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                  {typeName(value)}
                </span>
                <span className="text-sm text-muted-foreground">{typeDesc(value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isPending || !exercise) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-heading text-lg font-bold text-azul">{typeName(type)}</p>
        {isPending && <p className="text-sm text-muted-foreground">{t("generating")}</p>}
        {error && (
          <div className="flex flex-col gap-2 rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2">
            <p className="text-sm text-rojo">{error}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => generate(type)}>
                {t("retry")}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={reset}>
                {t("changeType")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const correctCount = results?.filter((r) => r.correct).length ?? 0;
  const resultFor = (id: number) => results?.find((r) => r.id === id);
  const isCloze = exercise.type === "cloze";
  const allAnswered = exercise.blanks.every((b) => (answers[b.id] ?? "").trim() !== "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading text-lg font-bold text-azul">{typeName(exercise.type)}</p>
        <span className="rounded-full bg-azul/10 px-2 py-0.5 text-xs font-medium text-azul">
          {levelLabel}
        </span>
      </div>

      <p lang="it" className="text-sm font-medium text-foreground">
        {exercise.instructions}
      </p>

      <AutoCorrectNotice text={t("autoCorrectNotice")} />

      <div
        lang="it"
        className="rounded-2xl border border-border bg-card p-5 text-base leading-loose text-foreground"
      >
        {splitText(exercise.text).map((part, index) => {
          if (part.kind === "text") return <span key={index}>{part.value}</span>;
          const blank = exercise.blanks.find((b) => b.id === part.id);
          if (!blank) return null;
          const result = resultFor(blank.id);

          if (isCloze) {
            return (
              <span
                key={index}
                className={`mx-1 inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold ${
                  result
                    ? result.correct
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rojo/15 text-rojo"
                    : "bg-azul/10 text-azul"
                }`}
              >
                {blank.id}
              </span>
            );
          }

          return (
            <input
              key={index}
              type="text"
              value={answers[blank.id] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, [blank.id]: event.target.value }))
              }
              disabled={graded}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`${blank.id}`}
              placeholder={`${blank.id}`}
              className={`mx-1 h-8 w-32 rounded-lg border px-2 text-center text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                result
                  ? result.correct
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rojo bg-rojo/10 text-rojo"
                  : "border-input bg-transparent"
              }`}
            />
          );
        })}
      </div>

      {isCloze && (
        <ul className="flex flex-col gap-3">
          {exercise.blanks.map((blank) => {
            const result = resultFor(blank.id);
            return (
              <li
                key={blank.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-azul/10 text-sm font-bold text-azul">
                  {blank.id}
                </span>
                <div lang="it" className="flex flex-wrap gap-2">
                  {blank.options.map((option, optionIndex) => {
                    const selected = answers[blank.id] === String(optionIndex);
                    const isRight = graded && optionIndex === blank.correctIndex;
                    const isWrongPick = graded && selected && !result?.correct;
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        disabled={graded}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [blank.id]: String(optionIndex) }))
                        }
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                          isRight
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : isWrongPick
                              ? "border-rojo bg-rojo/10 text-rojo"
                              : selected
                                ? "border-azul bg-azul text-primary-foreground"
                                : "border-border bg-background text-foreground hover:border-azul"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!graded && (
        <Button type="button" onClick={handleCheck} disabled={!allAnswered} className="self-start">
          {t("check")}
        </Button>
      )}

      {graded && results && (
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-2xl border px-5 py-4 font-heading text-xl font-bold tracking-tight ${
              correctCount === exercise.blanks.length
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : correctCount >= exercise.blanks.length / 2
                  ? "border-azul/30 bg-azul/10 text-azul"
                  : "border-rojo/30 bg-rojo/10 text-rojo"
            }`}
          >
            {t("score", { correct: correctCount, total: exercise.blanks.length })}
          </div>

          <AutoCorrectNotice text={t("autoCorrectNotice")} />

          <ul className="flex flex-col gap-3">
            {exercise.blanks.map((blank) => {
              const result = resultFor(blank.id);
              const correctAnswers = isCloze
                ? [blank.options[blank.correctIndex]]
                : blank.answers;
              return (
                <li
                  key={blank.id}
                  className={`flex flex-col gap-1.5 rounded-xl border p-4 ${
                    result?.correct
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rojo/30 bg-rojo/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-full bg-card text-xs font-bold text-foreground">
                      {blank.id}
                    </span>
                    <span
                      lang="it"
                      className={`font-medium ${
                        result?.correct
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-rojo line-through"
                      }`}
                    >
                      {result?.studentAnswer || t("noAnswer")}
                    </span>
                    {!result?.correct && (
                      <span lang="it" className="font-medium text-foreground">
                        → {correctAnswers.join(" / ")}
                      </span>
                    )}
                  </div>
                  <p lang="it" className="text-sm text-muted-foreground">
                    {blank.explanation}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => generate(exercise.type)}>
              {t("another")}
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              {t("changeType")}
            </Button>
          </div>
        </div>
      )}

      {!graded && (
        <Button type="button" variant="secondary" size="sm" onClick={reset} className="self-start">
          {t("changeType")}
        </Button>
      )}
    </div>
  );
}
