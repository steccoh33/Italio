"use client";

import { useLocale } from "next-intl";

/** Formatea en el navegador para usar la zona horaria de quien mira, no la del servidor. */
export function LocalDateTime({ value }: { value: string }) {
  const locale = useLocale();
  const text = new Date(value).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <time dateTime={value} suppressHydrationWarning>
      {text}
    </time>
  );
}
