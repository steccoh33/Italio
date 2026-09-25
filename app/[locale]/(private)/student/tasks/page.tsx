import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { isPastDue } from "@/lib/is-overdue";
import { LocalDateTime } from "@/components/local-date-time";
import type { StudentAssignmentRow } from "@/lib/types/assignment";

export default async function StudentTasksPage() {
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

  // RLS only returns assignments of the classes this student belongs to.
  const [{ data: rows }, { data: deliveredRows }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, class_id, teacher_id, title, instructions, due_date, created_at, classes(name)"
      ),
    supabase
      .from("writings")
      .select("assignment_id")
      .eq("student_id", profile.userId)
      .eq("status", "corrected")
      .not("assignment_id", "is", null),
  ]);

  const deliveredIds = new Set(
    (deliveredRows ?? []).map((row) => row.assignment_id as string)
  );

  const tasks: StudentAssignmentRow[] = (rows ?? []).map((row) => {
    const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    return {
      id: row.id,
      class_id: row.class_id,
      teacher_id: row.teacher_id,
      title: row.title,
      instructions: row.instructions,
      due_date: row.due_date,
      created_at: row.created_at,
      class_name: klass?.name ?? "",
      delivered: deliveredIds.has(row.id),
    };
  });

  // Pending first, then by due date (no date last), newest otherwise.
  tasks.sort((a, b) => {
    if (a.delivered !== b.delivered) return a.delivered ? 1 : -1;
    const da = a.due_date ? Date.parse(a.due_date) : Infinity;
    const db = b.due_date ? Date.parse(b.due_date) : Infinity;
    if (da !== db) return da - db;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });

  const t = await getTranslations("Assignments");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/student"
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToPanel")}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
          {t("studentTitle")}
        </h1>
        <p className="text-muted-foreground">{t("studentSubtitle")}</p>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noTasks")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => {
            const overdue = !task.delivered && isPastDue(task.due_date);
            return (
              <li key={task.id}>
                <Link
                  href={`/student/tasks/${task.id}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-azul"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.delivered
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amarillo/20 text-tinta dark:text-foreground"
                      }`}
                    >
                      {task.delivered ? t("statusDelivered") : t("statusPending")}
                    </span>
                    {overdue && (
                      <span className="rounded-full bg-rojo/10 px-2 py-0.5 text-xs font-medium text-rojo">
                        {t("overdue")}
                      </span>
                    )}
                  </div>
                  <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("fromClass", { name: task.class_name })}
                  </span>
                  <span className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {task.instructions}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {task.due_date ? (
                      <>
                        {t("dueOn")} <LocalDateTime value={task.due_date} />
                      </>
                    ) : (
                      t("noDue")
                    )}
                  </span>
                  <span className="mt-auto pt-2 text-sm font-medium text-azul">
                    {task.delivered ? t("viewSubmission") : t("startTask")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
