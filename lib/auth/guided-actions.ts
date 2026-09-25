"use server";

import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  CorrectionRequestError,
  MAX_CONSIGNA_PROPOSALS,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  proposeConsigna,
  runTutorTurn,
  type TutorMessage,
  type TutorTurn,
} from "@/lib/ai/guided-tutor";

export type GuidedTurnResult = {
  error: string | null;
  turn: TutorTurn | null;
};

/**
 * Un turno del tutor de escritura guiada. El nivel sale del perfil en el
 * servidor, nunca del navegador. Etapa A: la sesión no se guarda en la base.
 */
export async function guidedTurnAction(input: {
  history: TutorMessage[];
  consigna: string | null;
  validAnswers: number;
}): Promise<GuidedTurnResult> {
  const t = await getTranslations("GuidedWriting");

  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel
  ) {
    return { error: t("genericError"), turn: null };
  }

  const history = (Array.isArray(input.history) ? input.history : [])
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(
      (m) =>
        (m.role === "tutor" || m.role === "student") &&
        typeof m.text === "string" &&
        m.text.trim() !== ""
    )
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_CHARS) }));

  const consigna =
    typeof input.consigna === "string" && input.consigna.trim() !== ""
      ? input.consigna.trim().slice(0, 600)
      : null;

  const validAnswers = Number.isInteger(input.validAnswers)
    ? Math.min(Math.max(input.validAnswers, 0), 10)
    : 0;

  try {
    const turn = await runTutorTurn({
      targetLevel: profile.targetLevel,
      history,
      consigna,
      validAnswers,
    });
    return { error: null, turn };
  } catch (err) {
    const busy = err instanceof CorrectionRequestError && err.kind === "busy";
    return { error: busy ? t("modelBusy") : t("genericError"), turn: null };
  }
}

export type ProposeConsignaResult = {
  error: string | null;
  consigna: string | null;
};

/**
 * Propone una consigna del nivel del alumno. `previous` son las ya
 * propuestas en esta sesión, para que la nueva sea distinta; hay un tope
 * de propuestas para no gastar cupo de más.
 */
export async function proposeConsignaAction(
  previous: string[]
): Promise<ProposeConsignaResult> {
  const t = await getTranslations("GuidedWriting");

  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel
  ) {
    return { error: t("genericError"), consigna: null };
  }

  const cleanPrevious = (Array.isArray(previous) ? previous : [])
    .filter((p) => typeof p === "string" && p.trim() !== "")
    .map((p) => p.slice(0, 600));

  if (cleanPrevious.length >= MAX_CONSIGNA_PROPOSALS) {
    return { error: t("maxProposals"), consigna: null };
  }

  try {
    const consigna = await proposeConsigna({
      targetLevel: profile.targetLevel,
      previous: cleanPrevious,
    });
    return { error: null, consigna };
  } catch (err) {
    const busy = err instanceof CorrectionRequestError && err.kind === "busy";
    return { error: busy ? t("modelBusy") : t("genericError"), consigna: null };
  }
}

export type StartSessionResult = {
  error: string | null;
  sessionId: string | null;
};

/**
 * Crea la sesión guiada cuando el alumno acepta una consigna. Se inserta
 * con el cliente del alumno: RLS exige que sea suya y esté "en curso".
 */
export async function startGuidedSessionAction(
  consigna: string
): Promise<StartSessionResult> {
  const t = await getTranslations("GuidedWriting");

  const profile = await getCurrentProfile();
  const text = typeof consigna === "string" ? consigna.trim().slice(0, 600) : "";
  if (
    !profile ||
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel ||
    !text
  ) {
    return { error: t("genericError"), sessionId: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guided_sessions")
    .insert({
      student_id: profile.userId,
      target_level: profile.targetLevel,
      prompt_text: text,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: t("genericError"), sessionId: null };
  }

  return { error: null, sessionId: data.id };
}
