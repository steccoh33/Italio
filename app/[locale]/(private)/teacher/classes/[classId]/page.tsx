import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { ClassDetailPanel } from "@/components/teacher/class-detail-panel";
import type { ClassMemberRow } from "@/lib/types/class";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
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

  const [{ data: klass }, { data: students }, { data: members }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("id, name")
        .eq("id", classId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("teacher_id", profile.userId)
        .eq("role", "student")
        .order("full_name", { ascending: true }),
      supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", classId),
    ]);

  // RLS already scopes classes to the caller's own rows, so a missing
  // row here means either it doesn't exist or it isn't theirs.
  if (!klass) {
    return redirect({ href: "/teacher/classes", locale });
  }

  const memberIds = new Set((members ?? []).map((row) => row.student_id as string));
  const roster: ClassMemberRow[] = (students ?? []).map((student) => ({
    id: student.id,
    full_name: student.full_name,
    isMember: memberIds.has(student.id),
  }));

  const t = await getTranslations("Classes");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/teacher/classes"
        className="text-sm font-medium text-azul hover:underline"
      >
        {t("backToClasses")}
      </Link>

      <ClassDetailPanel
        classId={klass.id}
        initialName={klass.name}
        roster={roster}
      />
    </div>
  );
}
