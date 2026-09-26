import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { fetchCompletedGuidedSessions } from "@/lib/guided/fetch-sessions";
import { GuidedWriting } from "@/components/student/guided-writing";
import { GuidedSessionsList } from "@/components/writing/guided-sessions-list";

export default async function GuidedWritingPage() {
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

  const t = await getTranslations("GuidedWriting");
  const supabase = await createClient();
  const sessions = await fetchCompletedGuidedSessions(supabase, profile.userId);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/student"
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToPanel")}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-marca sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <GuidedWriting targetLevel={profile.targetLevel} />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("historyTitle")}
        </h2>
        <GuidedSessionsList
          sessions={sessions}
          emptyMessage={t("noHistory")}
        />
      </section>
    </div>
  );
}
