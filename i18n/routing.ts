import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "es"],
  defaultLocale: "it",
  localePrefix: "as-needed",
});
