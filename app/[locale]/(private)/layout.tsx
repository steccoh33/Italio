import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PrivateNav } from "@/components/private-nav";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("AccountStatus");
  const profile = await getCurrentProfile();
  const showAdminNav =
    profile?.role === "admin" && profile.effectiveStatus === "active";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-6 py-4 sm:px-10">
        <Link
          href="/panel"
          className="font-heading text-lg font-bold text-azul"
        >
          Italio
        </Link>
        {showAdminNav && <PrivateNav />}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              {t("signOut")}
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
