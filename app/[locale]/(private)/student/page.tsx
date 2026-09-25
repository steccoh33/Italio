import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { StudentPanelTabs } from "@/components/student/student-panel-tabs";
import type { WritingWithCorrection } from "@/lib/types/writing";

export default async function StudentPage() {
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  if (profile.role !== "student" || profile.effectiveStatus !== "active") {
    return redirect({ href: "/panel", locale });
  }

  if (!profile.targetLevel) {
    return redirect({ href: "/panel", locale });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("writings")
    .select(
      "id, student_id, target_level, prompt_text, content, status, created_at, corrections(writing_id, corrected_text, errors, assessment, level_verdict, level_demonstrated, general_comment, created_at)"
    )
    .eq("student_id", profile.userId)
    .order("created_at", { ascending: false });

  const writings: WritingWithCorrection[] = (data ?? []).map((row) => {
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

  const t = await getTranslations("Student");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/student/tasks"
            className={buttonVariants({ variant: "secondary" })}
          >
            {t("tasksLink")}
          </Link>
          <Link
            href="/student/guide"
            className={buttonVariants({ variant: "secondary" })}
          >
            {t("guidesLink")}
          </Link>
        </div>
      </div>

      <StudentPanelTabs targetLevel={profile.targetLevel} writings={writings} />
    </div>
  );
}
