import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { GuidedWriting } from "@/components/student/guided-writing";

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
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <GuidedWriting targetLevel={profile.targetLevel} />
    </div>
  );
}
