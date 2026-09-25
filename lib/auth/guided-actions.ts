"use server";

import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  CorrectionRequestError,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
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
