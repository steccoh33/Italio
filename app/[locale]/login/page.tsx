import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  if (profile) {
    return redirect({ href: "/panel", locale });
  }

  const t = await getTranslations("Login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-azul">
          {t("title")}
        </h1>
        <p className="max-w-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <LoginForm />
    </div>
  );
}
