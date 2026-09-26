import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { CILS_LEVEL_INFO } from "@/lib/cils-levels";
import {
  computeStudentStats,
  type ExerciseAttempt,
  type StatsWriting,
} from "@/lib/stats/student-stats";
import { StudentStatsView } from "@/components/teacher/student-stats-view";
import type { CilsLevel } from "@/lib/types/profile";

export default async function StudentStatsPage({
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

  // Access rule: only the owner teacher (or admin as master teacher) sees a
  // student. RLS already enforces it; the explicit teacher_id filter keeps
  // the rule visible here.
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, target_level")
    .eq("id", studentId)
    .eq("teacher_id", profile.userId)
    .eq("role", "student")
    .maybeSingle();

  if (!student) {
    return redirect({ href: "/teacher", locale });
  }

  const { data: rows } = await supabase
    .from("writings")
    .select(
      "created_at, assignment_id, guided_session_id, corrections(assessment, level_verdict, errors)"
    )
    .eq("student_id", studentId)
    .eq("status", "corrected");

  const writings: StatsWriting[] = [];
  for (const row of rows ?? []) {
    const correction = Array.isArray(row.corrections)
      ? row.corrections[0]
      : row.corrections;
    if (!correction) continue;
    writings.push({
      created_at: row.created_at,
      assignment_id: row.assignment_id,
      guided_session_id: row.guided_session_id,
      assessment: correction.assessment,
      level_verdict: correction.level_verdict,
      errors: correction.errors,
    });
  }

  const { data: attemptRows } = await supabase
    .from("exercise_attempts")
    .select("exercise_type, total_blanks, correct_count, created_at")
    .eq("student_id", studentId);

  const stats = computeStudentStats(writings, (attemptRows ?? []) as ExerciseAttempt[]);
  const t = await getTranslations("Stats");
  const level = student.target_level as CilsLevel | null;
  const levelLabel = level ? CILS_LEVEL_INFO[level].label : "-";

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href={`/teacher/students/${studentId}`}
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToStudent")}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-marca sm:text-4xl">
          {t("title", { name: student.full_name ?? "" })}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <StudentStatsView
        stats={stats}
        studentName={student.full_name ?? ""}
        targetLevelLabel={levelLabel}
      />
    </div>
  );
}
