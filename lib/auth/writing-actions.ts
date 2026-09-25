"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCilsLevel } from "@/lib/cils-levels";
import { correctWriting, CorrectionRequestError } from "@/lib/ai/correct-writing";
import type { CorrectionPayload } from "@/lib/types/writing";

export type SubmitWritingState = {
  error: string | null;
  result: (CorrectionPayload & { writingId: string }) | null;
};

/**
 * Creates the writing as the student (RLS-scoped), then calls Gemini and
 * writes the correction with the service key: corrections are never
 * writable by the student directly, only by the server.
 */
export async function submitWritingAction(
  _prevState: SubmitWritingState,
  formData: FormData
): Promise<SubmitWritingState> {
  const t = await getTranslations("Writing");

  let promptText = ((formData.get("promptText") as string) ?? "").trim();
  const content = ((formData.get("content") as string) ?? "").trim();
  const targetLevel = formData.get("targetLevel") as string;
  const assignmentId = ((formData.get("assignmentId") as string) ?? "").trim();

  if (!content || !isCilsLevel(targetLevel)) {
    return { error: t("genericError"), result: null };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: t("genericError"), result: null };
  }

  if (assignmentId) {
    // The prompt comes from the database, never from the client. RLS only
    // returns the assignment if the student belongs to its class.
    const { data: assignment } = await supabase
      .from("assignments")
      .select("instructions")
      .eq("id", assignmentId)
      .maybeSingle();

    if (!assignment) {
      return { error: t("genericError"), result: null };
    }

    const { data: existing } = await supabase
      .from("writings")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", userId)
      .eq("status", "corrected")
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: t("alreadySubmitted"), result: null };
    }

    // A submission stuck in "pending" (e.g. the server died mid-correction)
    // would block a retry through the one-submission-per-task index, so
    // anything pending for more than 5 minutes is released as an error.
    await createAdminClient()
      .from("writings")
      .update({ status: "error" })
      .eq("assignment_id", assignmentId)
      .eq("student_id", userId)
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    promptText = assignment.instructions;
  }

  const { data: writing, error: insertError } = await supabase
    .from("writings")
    .insert({
      student_id: userId,
      target_level: targetLevel,
      prompt_text: promptText || null,
      content,
      status: "pending",
      assignment_id: assignmentId || null,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    // Unique index: this student already has a submission for this task.
    return { error: t("alreadySubmitted"), result: null };
  }

  if (insertError || !writing) {
    return { error: t("genericError"), result: null };
  }

  const admin = createAdminClient();

  try {
    const correction = await correctWriting({
      targetLevel,
      promptText: promptText || null,
      content,
    });

    const { error: correctionError } = await admin.from("corrections").insert({
      writing_id: writing.id,
      corrected_text: correction.corrected_text,
      errors: correction.errors,
      assessment: correction.assessment,
      level_verdict: correction.level_verdict,
      level_demonstrated: correction.level_demonstrated,
      general_comment: correction.general_comment,
    });

    if (correctionError) {
      await admin.from("writings").update({ status: "error" }).eq("id", writing.id);
      return { error: t("correctionError"), result: null };
    }

    await admin.from("writings").update({ status: "corrected" }).eq("id", writing.id);

    return {
      error: null,
      result: { writingId: writing.id, ...correction },
    };
  } catch (err) {
    await admin.from("writings").update({ status: "error" }).eq("id", writing.id);
    const busy = err instanceof CorrectionRequestError && err.kind === "busy";
    return {
      error: busy ? t("modelBusy") : t("correctionError"),
      result: null,
    };
  }
}
