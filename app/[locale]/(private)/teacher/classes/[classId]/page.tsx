import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { ClassDetailPanel } from "@/components/teacher/class-detail-panel";
import { AssignmentsSection } from "@/components/teacher/assignments-section";
import type { ClassMemberRow } from "@/lib/types/class";
import type { AssignmentSummaryRow } from "@/lib/types/assignment";

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

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, title, due_date")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  const assignmentIds = (assignmentRows ?? []).map((row) => row.id as string);
  const { data: deliveredRows } =
    assignmentIds.length > 0
      ? await supabase
          .from("writings")
          .select("assignment_id, student_id")
          .in("assignment_id", assignmentIds)
          .eq("status", "corrected")
      : { data: [] };

  // "Delivered" counts distinct current members of the class with a
  // corrected writing for that assignment.
  const deliveredByAssignment = new Map<string, Set<string>>();
  for (const row of deliveredRows ?? []) {
    if (!memberIds.has(row.student_id as string)) continue;
    const set = deliveredByAssignment.get(row.assignment_id as string) ?? new Set();
    set.add(row.student_id as string);
    deliveredByAssignment.set(row.assignment_id as string, set);
  }

  const assignments: AssignmentSummaryRow[] = (assignmentRows ?? []).map(
    (row) => ({
      id: row.id,
      title: row.title,
      due_date: row.due_date,
      delivered: deliveredByAssignment.get(row.id)?.size ?? 0,
      total: memberIds.size,
    })
  );

  const t = await getTranslations("Classes");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/teacher/classes"
        className="text-sm font-medium text-azul hover:underline"
      >
        {t("backToClasses")}
      </Link>

      <AssignmentsSection classId={klass.id} assignments={assignments} />

      <ClassDetailPanel
        classId={klass.id}
        initialName={klass.name}
        roster={roster}
      />
    </div>
  );
}
