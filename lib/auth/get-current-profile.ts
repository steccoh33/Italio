import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CilsLevel, UserRole, UserStatus } from "@/lib/types/profile";

export type CurrentProfile = {
  userId: string;
  role: UserRole;
  status: UserStatus;
  fullName: string | null;
  teacherCode: string | null;
  teacherId: string | null;
  loginCode: string;
  targetLevel: CilsLevel | null;
  /** Own status, adjusted for students whose teacher isn't active. */
  effectiveStatus: UserStatus;
};

/**
 * Reads the logged-in user's profile, if any. For students, "effective
 * access" also depends on their teacher's status: a student only counts as
 * active if they themselves are active AND their teacher is active too.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "role, status, full_name, teacher_code, teacher_id, login_code, target_level"
    )
    .eq("id", userId)
    .single();

  if (!profile) {
    return null;
  }

  let effectiveStatus: UserStatus = profile.status;

  if (
    profile.role === "student" &&
    profile.status === "active" &&
    profile.teacher_id
  ) {
    // RLS only lets a user read their own row, so the teacher's status is
    // looked up with the admin client, bypassing RLS for this one narrow,
    // server-only check.
    const admin = createAdminClient();
    const { data: teacherProfile } = await admin
      .from("profiles")
      .select("status")
      .eq("id", profile.teacher_id)
      .single();

    if (teacherProfile && teacherProfile.status !== "active") {
      effectiveStatus = teacherProfile.status;
    }
  }

  return {
    userId,
    role: profile.role,
    status: profile.status,
    fullName: profile.full_name,
    teacherCode: profile.teacher_code,
    teacherId: profile.teacher_id,
    loginCode: profile.login_code,
    targetLevel: profile.target_level,
    effectiveStatus,
  };
}
