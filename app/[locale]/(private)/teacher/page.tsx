import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { ShareCodeCard } from "@/components/teacher/share-code-card";
import { StudentsPanel } from "@/components/teacher/students-panel";
import { buttonVariants } from "@/components/ui/button";
import type { TeacherStudentRow } from "@/lib/types/profile";

export default async function TeacherPage() {
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
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, status, login_code, created_at")
    .eq("teacher_id", profile.userId)
    .eq("role", "student")
    .order("created_at", { ascending: false });
  const students = (data ?? []) as TeacherStudentRow[];

  const t = await getTranslations("Teacher");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {profile.teacherCode && (
        <ShareCodeCard
          teacherCode={profile.teacherCode}
          loginCode={profile.loginCode}
        />
      )}

      <Link
        href="/teacher/classes"
        className={buttonVariants({
          variant: "secondary",
          size: "sm",
          className: "self-start",
        })}
      >
        {t("classesLink")}
      </Link>

      <StudentsPanel students={students} />
    </div>
  );
}
