import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { LocalDateTime } from "@/components/local-date-time";
import { AssignmentControls } from "@/components/teacher/assignment-controls";
import { WritingHistoryList } from "@/components/writing/writing-history-list";
import type { WritingWithCorrection } from "@/lib/types/writing";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
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

  // RLS scopes assignments to the caller's own classes, so a missing row
  // means it doesn't exist or isn't theirs.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, class_id, title, instructions, due_date")
    .eq("id", assignmentId)
    .eq("class_id", classId)
    .maybeSingle();

  if (!assignment) {
    return redirect({ href: `/teacher/classes/${classId}`, locale });
  }

  const { data: members } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId);
  const memberIds = (members ?? []).map((row) => row.student_id as string);

  const [{ data: students }, { data: writingRows }] = await Promise.all([
    memberIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", memberIds)
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("writings")
      .select(
        "id, student_id, target_level, prompt_text, content, status, created_at, corrections(writing_id, corrected_text, errors, assessment, level_verdict, level_demonstrated, general_comment, created_at)"
      )
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false }),
  ]);

  const writingsByStudent = new Map<string, WritingWithCorrection[]>();
  for (const row of writingRows ?? []) {
    const correction = Array.isArray(row.corrections)
      ? row.corrections[0] ?? null
      : row.corrections ?? null;
    const item: WritingWithCorrection = {
      id: row.id,
      student_id: row.student_id,
      target_level: row.target_level,
      prompt_text: row.prompt_text,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      correction,
    };
    const list = writingsByStudent.get(row.student_id) ?? [];
    list.push(item);
    writingsByStudent.set(row.student_id, list);
  }

  const roster = (students ?? []).map((student) => {
    const writings = writingsByStudent.get(student.id) ?? [];
    return {
      id: student.id as string,
      name: (student.full_name as string | null) ?? "",
      writings,
      delivered: writings.some((w) => w.status === "corrected"),
    };
  });
  const deliveredCount = roster.filter((s) => s.delivered).length;

  const t = await getTranslations("Assignments");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href={`/teacher/classes/${classId}`}
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToClass")}
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
          {assignment.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {assignment.due_date ? (
            <>
              {t("dueOn")} <LocalDateTime value={assignment.due_date} />
            </>
          ) : (
            t("noDue")
          )}
        </p>
        <p className="whitespace-pre-wrap rounded-xl border border-azul/30 bg-azul/5 p-4 text-sm text-foreground">
          {assignment.instructions}
        </p>
      </div>

      <AssignmentControls
        classId={classId}
        assignment={{
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
          due_date: assignment.due_date,
        }}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("roster")}
          </h2>
          <span className="rounded-full bg-azul/10 px-3 py-1 text-xs font-medium text-azul">
            {t("deliveries", { done: deliveredCount, total: roster.length })}
          </span>
        </div>

        {roster.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {t("noStudents")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {roster.map((student) => (
              <li
                key={student.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {student.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      student.delivered
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amarillo/20 text-tinta dark:text-foreground"
                    }`}
                  >
                    {student.delivered ? t("statusDelivered") : t("statusPending")}
                  </span>
                </div>
                {student.delivered && (
                  <WritingHistoryList writings={student.writings} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
