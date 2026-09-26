import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getCurrentYear } from "@/lib/current-year";

/** Hover suave y compartido para botones y tarjetas de las páginas públicas. */
export const LIFT =
  "transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md";

/**
 * Encabezado y pie comunes de todas las páginas públicas (sin sesión):
 * landing, /chi-siamo, /terminos y /privacy. Las páginas privadas tienen
 * su propio encabezado y no usan este componente.
 */
export async function PublicShell({
  children,
  width = "max-w-6xl",
}: {
  children: ReactNode;
  /** Ancho máximo del encabezado y del pie (el contenido lo define cada página). */
  width?: string;
}) {
  const t = await getTranslations("PublicShell");
  const year = getCurrentYear();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border/60">
        <div
          className={`mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 ${width}`}
        >
          <Link
            href="/"
            aria-label={t("homeAria")}
            className="font-heading text-xl font-bold tracking-tight text-marca sm:text-2xl"
          >
            Italio
          </Link>

          <nav
            aria-label={t("mainNav")}
            className="flex items-center gap-2 sm:gap-4"
          >
            <Link
              href="/chi-siamo"
              className="hidden text-sm font-medium text-foreground underline-offset-4 hover:text-azul hover:underline md:inline"
            >
              {t("about")}
            </Link>
            <Link
              href="/login"
              className="px-1 text-sm font-medium text-foreground underline-offset-4 hover:text-azul hover:underline"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/registro"
              className={buttonVariants({
                size: "sm",
                className: `h-8 px-3 text-sm ${LIFT}`,
              })}
            >
              {t("signUp")}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border">
        <div
          className={`mx-auto flex w-full flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between ${width}`}
        >
          <div className="flex flex-col gap-1">
            <span className="font-heading text-xl font-bold tracking-tight text-marca">
              Italio
            </span>
            <span className="text-sm text-muted-foreground">
              © {year} Italio. {t("footerRights")}
            </span>
          </div>
          <nav
            aria-label={t("footerNav")}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            <Link href="/chi-siamo" className="hover:text-foreground">
              {t("about")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              {t("privacy")}
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              {t("terms")}
            </Link>
          </nav>
          <LocaleSwitcher />
        </div>
      </footer>
    </div>
  );
}
