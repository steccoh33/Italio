import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { LocalDateTime } from "@/components/local-date-time";
import { WritingForm } from "@/components/student/writing-form";
import { CorrectionResult } from "@/components/writing/correction-result";
import type { CorrectionPayload } from "@/lib/types/writing";

export default async function StudentTaskPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  if (
    profile.role !== "student" ||
    profile.effectiveStatus !== "active" ||
    !profile.targetLevel
  ) {
    return redirect({ href: "/panel", locale });
  }

  const supabase = await createClient();

  // RLS: the assignment only exists for students of its class.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, instructions, due_date, classes(name)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) {
    return redirect({ href: "/student/tasks", locale });
  }

  const { data: submitted } = await supabase
    .from("writings")
    .select(
      "id, content, target_level, corrections(corrected_text, errors, assessment, level_verdict, level_demonstrated, general_comment)"
    )
    .eq("assignment_id", assignmentId)
    .eq("student_id", profile.userId)
    .eq("status", "corrected")
    .order("created_at", { ascending: false })
    .limit(1);

  const delivered = submitted?.[0] ?? null;
  const correction = delivered
    ? ((Array.isArray(delivered.corrections)
        ? delivered.corrections[0]
        : delivered.corrections) as CorrectionPayload | null)
    : null;

  const klass = Array.isArray(assignment.classes)
    ? assignment.classes[0]
    : assignment.classes;

  const t = await getTranslations("Assignments");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/student/tasks"
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToTasks")}
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              delivered
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amarillo/20 text-tinta dark:text-foreground"
            }`}
          >
            {delivered ? t("statusDelivered") : t("statusPending")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("fromClass", { name: klass?.name ?? "" })}
          </span>
        </div>
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
      </div>

      {delivered && correction ? (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap rounded-xl border border-azul/30 bg-azul/5 p-4 text-sm text-foreground">
            {assignment.instructions}
          </p>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("yourSubmission")}
          </h2>
          <CorrectionResult
            originalText={delivered.content}
            correction={correction}
            targetLevel={delivered.target_level}
          />
        </div>
      ) : (
        <WritingForm
          targetLevel={profile.targetLevel}
          assignment={{ id: assignment.id, instructions: assignment.instructions }}
        />
      )}
    </div>
  );
}
