import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getGuideForLevel, type GuideLocale } from "@/lib/guides/guides-content";
import { GuideContent } from "@/components/guides/guide-content";

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ guideId: string }>;
}) {
  const { guideId } = await params;
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

  // Looked up only inside the student's own level: a guide from another
  // level simply doesn't exist for them, even by typing its URL.
  const guide = getGuideForLevel(profile.targetLevel, guideId);
  if (!guide) {
    return redirect({ href: "/student/guide", locale });
  }

  const t = await getTranslations("Guides");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <Link
        href="/student/guide"
        className="self-start text-sm font-medium text-azul hover:underline"
      >
        {t("backToGuides")}
      </Link>

      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full bg-azul/10 px-2 py-0.5 text-xs font-medium text-azul">
          {guide.level}
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-azul sm:text-4xl">
          {guide.title[locale]}
        </h1>
      </div>

      <GuideContent guide={guide} locale={locale} />
    </div>
  );
}
