import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { AdminTeachersPanel } from "@/components/admin/teachers-panel";
import type { AdminTeacherRow } from "@/lib/types/profile";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  if (profile.role !== "admin" || profile.effectiveStatus !== "active") {
    return redirect({ href: "/panel", locale });
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_teachers");
  const teachers = (data ?? []) as AdminTeacherRow[];

  const t = await getTranslations("Admin");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-marca sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminTeachersPanel teachers={teachers} />
    </div>
  );
}
