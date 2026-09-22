"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

const labels: Record<string, string> = {
  it: "It",
  es: "Es",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-current={active}
            onClick={() => router.replace(pathname, { locale: code })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {labels[code]}
          </button>
        );
      })}
    </div>
  );
}
