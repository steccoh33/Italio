import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { CreateClassForm } from "@/components/teacher/create-class-form";
import type { TeacherClassRow } from "@/lib/types/class";

export default async function ClassesPage() {
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
  const [{ data: classesData }, { data: membershipsData }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("teacher_id", profile.userId)
      .order("created_at", { ascending: false }),
    supabase.from("class_students").select("class_id, student_id"),
  ]);

  const counts = new Map<string, number>();
  for (const row of membershipsData ?? []) {
    counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1);
  }

  const classes: TeacherClassRow[] = (classesData ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    student_count: counts.get(row.id) ?? 0,
  }));

  const t = await getTranslations("Classes");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/teacher"
          className="text-sm font-medium text-azul hover:underline"
        >
          {t("backToTeacher")}
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CreateClassForm />

      {classes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noClasses")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {classes.map((klass) => (
            <li
              key={klass.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {klass.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("studentCount", { count: klass.student_count })}
                </span>
              </div>
              <Link
                href={`/teacher/classes/${klass.id}`}
                className="text-sm font-medium text-azul hover:underline"
              >
                {t("viewButton")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
