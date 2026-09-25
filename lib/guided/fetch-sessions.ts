import type { createClient } from "@/lib/supabase/server";
import type { GuidedSessionRow } from "@/lib/types/guided";
import type { CorrectionRow, WritingWithCorrection } from "@/lib/types/writing";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Sesiones de escritura guiada COMPLETADAS de un alumno, con su texto final
 * corregido. Se consulta con el cliente del usuario: RLS decide quién ve qué
 * (el propio alumno, o el profesor dueño de ese alumno).
 */
export async function fetchCompletedGuidedSessions(
  supabase: SupabaseServerClient,
  studentId: string
): Promise<GuidedSessionRow[]> {
  const { data } = await supabase
    .from("guided_sessions")
    .select(
      "id, target_level, prompt_text, plan_summary, status, created_at, completed_at, writings(id, student_id, target_level, prompt_text, content, status, created_at, corrections(writing_id, corrected_text, errors, assessment, level_verdict, level_demonstrated, general_comment, created_at))"
    )
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const sessions: GuidedSessionRow[] = [];
  for (const row of data ?? []) {
    const writings = (Array.isArray(row.writings) ? row.writings : [row.writings])
      .filter(Boolean)
      .filter((w: { status: string }) => w.status === "corrected");
    const raw = writings[0];
    if (!raw) continue;

    const correction = (Array.isArray(raw.corrections)
      ? raw.corrections[0]
      : raw.corrections) as CorrectionRow | null;

    const writing: WritingWithCorrection = {
      id: raw.id,
      student_id: raw.student_id,
      target_level: raw.target_level,
      prompt_text: raw.prompt_text,
      content: raw.content,
      status: raw.status,
      created_at: raw.created_at,
      correction: correction ?? null,
    };

    sessions.push({
      id: row.id,
      target_level: row.target_level,
      prompt_text: row.prompt_text,
      plan_summary: row.plan_summary,
      status: row.status,
      created_at: row.created_at,
      completed_at: row.completed_at,
      writing,
    });
  }

  return sessions;
}
