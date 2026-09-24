"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { href: "/admin", labelKey: "adminTab" },
  { href: "/teacher", labelKey: "teacherTab" },
] as const;

export function PrivateNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav className="inline-flex rounded-full border border-border bg-card p-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
