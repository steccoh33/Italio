import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { CILS_LEVEL_INFO } from "@/lib/cils-levels";
import { getGuidesForLevel, type GuideLocale } from "@/lib/guides/guides-content";

export default async function GuidesPage() {
  const profile = await getCurrentProfile();
  const locale = (await getLocale()) as GuideLocale;

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

  const t = await getTranslations("Guides");
  const guides = getGuidesForLevel(profile.targetLevel);
  const levelLabel = CILS_LEVEL_INFO[profile.targetLevel].label;

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
        <p className="text-muted-foreground">
          {t("subtitle", { level: levelLabel })}
        </p>
      </div>

      {guides.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("comingSoon")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link
                href={`/student/guide/${guide.id}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-azul"
              >
                <span className="w-fit rounded-full bg-azul/10 px-2 py-0.5 text-xs font-medium text-azul">
                  {guide.level}
                </span>
                <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                  {guide.title[locale]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {guide.whatIsIt[locale]}
                </span>
                <span className="mt-auto pt-2 text-sm font-medium text-azul">
                  {t("openGuide")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
