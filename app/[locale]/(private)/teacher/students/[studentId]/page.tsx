import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { WritingHistoryList } from "@/components/writing/writing-history-list";
import { GuidedSessionsList } from "@/components/writing/guided-sessions-list";
import { fetchCompletedGuidedSessions } from "@/lib/guided/fetch-sessions";
import type { WritingWithCorrection } from "@/lib/types/writing";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  const isTeacherOrAdmin = profile.role === "teacher" || profile.role === "admin";
  if (!isTeacherOrAdmin || profile.effectiveStatus !== "active") {
    return redirect({ href: "/panel", locale });
  }

  const supabase = await createClient();

  const [{ data: student }, { data: rows }, guidedSessions] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", studentId)
      .eq("teacher_id", profile.userId)
      .eq("role", "student")
      .maybeSingle(),
    supabase
      .from("writings")
      .select(
        "id, student_id, target_level, prompt_text, content, status, created_at, corrections(writing_id, corrected_text, errors, assessment, level_verdict, level_demonstrated, general_comment, created_at)"
      )
      .eq("student_id", studentId)
      .is("guided_session_id", null)
      .order("created_at", { ascending: false }),
    fetchCompletedGuidedSessions(supabase, studentId),
  ]);

  // RLS already scopes profiles to the caller's own students, so a
  // missing row here means either it doesn't exist or it isn't theirs.
  if (!student) {
    return redirect({ href: "/teacher", locale });
  }

  const writings: WritingWithCorrection[] = (rows ?? []).map((row) => {
    const correctionRow = Array.isArray(row.corrections)
      ? row.corrections[0] ?? null
      : row.corrections ?? null;

    return {
      id: row.id,
      student_id: row.student_id,
      target_level: row.target_level,
      prompt_text: row.prompt_text,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      correction: correctionRow,
    };
  });

  const t = await getTranslations("TeacherStudentDetail");
  const tGuided = await getTranslations("GuidedWriting");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link href="/teacher" className="text-sm font-medium text-azul hover:underline">
        {t("backToStudents")}
      </Link>

      <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
        {t("title", { name: student.full_name ?? "" })}
      </h1>

      <WritingHistoryList writings={writings} emptyMessage={t("noWritings")} />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {tGuided("teacherSectionTitle")}
        </h2>
        <GuidedSessionsList
          sessions={guidedSessions}
          emptyMessage={tGuided("teacherNoSessions")}
        />
      </section>
    </div>
  );
}
