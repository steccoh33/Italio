import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getRolePanelHref } from "@/lib/auth/role-panel";

export default async function PanelPage() {
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (!profile) {
    return redirect({ href: "/login", locale });
  }

  if (profile.effectiveStatus === "active") {
    const rolePanelHref = getRolePanelHref(profile.role);
    if (rolePanelHref) {
      return redirect({ href: rolePanelHref, locale });
    }
  }

  const t = await getTranslations("AccountStatus");
  const showCodes =
    profile.effectiveStatus === "pending" || profile.effectiveStatus === "paused";
  const isStaff = profile.role === "teacher" || profile.role === "admin";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      {profile.effectiveStatus === "pending" && (
        <>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-azul">
            {t("pendingTitle")}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            {t("pendingBody")}
          </p>
        </>
      )}

      {profile.effectiveStatus === "paused" && (
        <>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-azul">
            {t("pausedTitle")}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            {t("pausedBody")}
          </p>
        </>
      )}

      {profile.effectiveStatus === "active" && (
        <>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-azul">
            {t("welcomeTitle")}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            {t("welcomeBody")}
          </p>
        </>
      )}

      {showCodes && (
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left">
          <p className="text-xs font-medium text-muted-foreground">
            {t("saveCodesNote")}
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {t("loginCodeLabel")}
            </p>
            <p className="font-heading text-2xl font-bold tracking-tight text-azul break-all">
              {profile.loginCode}
            </p>
          </div>

          {isStaff && profile.teacherCode && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                {t("shareCodeLabel")}
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight text-azul break-all">
                {profile.teacherCode}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
