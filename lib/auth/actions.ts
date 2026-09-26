"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCilsLevel } from "@/lib/cils-levels";
import { LEGAL_VERSION } from "@/lib/legal/legal-content";

export type AuthActionState = {
  error: string | null;
};

const TEACHER_CODE_REGEX = /^[A-Z]{3}-[0-9]{3}$/;
// Not a real mailbox: Supabase Auth still models accounts as email+password
// under the hood, so registration derives a unique, non-deliverable email
// from the generated login_code instead of asking anyone to pick one.
const INTERNAL_EMAIL_DOMAIN = "italio.local";

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const t = await getTranslations("Register");

  const role = formData.get("role");
  const fullName = ((formData.get("fullName") as string) ?? "").trim();

  if (role !== "teacher" && role !== "student") {
    return { error: t("genericError") };
  }

  if (!fullName) {
    return { error: t("genericError") };
  }

  if (formData.get("acceptTerms") !== "on") {
    return { error: t("consentRequired") };
  }

  const admin = createAdminClient();
  let teacherCode: string | null = null;
  let targetLevel: string | null = null;

  if (role === "student") {
    teacherCode = ((formData.get("teacherCode") as string) ?? "")
      .trim()
      .toUpperCase();

    if (!TEACHER_CODE_REGEX.test(teacherCode)) {
      return { error: t("invalidTeacherCode") };
    }

    targetLevel = (formData.get("targetLevel") as string) ?? "";
    if (!isCilsLevel(targetLevel)) {
      return { error: t("genericError") };
    }

    // RLS blocks reading another user's profile, so this lookup needs the
    // admin client. It only checks whether the code maps to a teacher/admin
    // — it never returns anything beyond that to the caller.
    const { data: teacherProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("teacher_code", teacherCode)
      .in("role", ["teacher", "admin"])
      .maybeSingle();

    if (!teacherProfile) {
      return { error: t("invalidTeacherCode") };
    }
  }

  const { data: loginCode, error: loginCodeError } = await admin.rpc(
    "generate_login_code",
    { word_count: role === "teacher" ? 3 : 2 }
  );

  if (loginCodeError || !loginCode) {
    return { error: t("genericError") };
  }

  const email = `${loginCode}@${INTERNAL_EMAIL_DOMAIN}`;

  const acceptedAt = new Date().toISOString();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: loginCode,
    email_confirm: true,
    user_metadata:
      role === "teacher"
        ? { role: "teacher", full_name: fullName, login_code: loginCode }
        : {
            role: "student",
            full_name: fullName,
            teacher_code: teacherCode,
            login_code: loginCode,
            target_level: targetLevel,
          },
  });

  if (createError || !created.user) {
    return { error: t("genericError") };
  }

  // Constancia de cuándo y qué versión de los términos aceptó. Sin ella no
  // dejamos la cuenta creada: se deshace el alta.
  const { error: consentError } = await admin
    .from("profiles")
    .update({ terms_accepted_at: acceptedAt, terms_version: LEGAL_VERSION })
    .eq("id", created.user.id);

  if (consentError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: loginCode,
  });

  if (signInError) {
    return { error: t("genericError") };
  }

  const locale = await getLocale();
  return redirect({ href: "/panel", locale });
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const t = await getTranslations("Login");

  const loginCode = ((formData.get("loginCode") as string) ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (!loginCode) {
    return { error: t("invalidLoginCode") };
  }

  // Server-side lookup with the admin client: nobody has a session yet at
  // this point, so RLS (own-profile-only) would never match anyway.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("login_code", loginCode)
    .maybeSingle();

  if (!profile) {
    return { error: t("invalidLoginCode") };
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(profile.id);

  if (userError || !userData?.user?.email) {
    return { error: t("invalidLoginCode") };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: loginCode,
  });

  if (signInError) {
    return { error: t("invalidLoginCode") };
  }

  const locale = await getLocale();
  return redirect({ href: "/panel", locale });
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = await getLocale();
  return redirect({ href: "/login", locale });
}
