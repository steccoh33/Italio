import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";

const CONTACT_EMAIL = "steccoh88@gmail.com";

export async function generateMetadata() {
  const t = await getTranslations("About");
  return { title: t("metaTitle") };
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  const hasWhy2 = t.has("why2");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-azul"
        >
          Italio
        </Link>
        <LocaleSwitcher />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-4 pb-16 sm:pt-8">
        <Link href="/" className="text-sm font-medium text-azul hover:underline">
          ← {t("back")}
        </Link>

        {/* Presentación */}
        <section className="mt-8 grid items-center gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
          <div
            role="img"
            aria-label={t("monogramAlt")}
            className="relative flex size-32 items-center justify-center rounded-[2rem] bg-amarillo sm:size-44"
          >
            <span
              className="font-heading text-6xl font-bold text-tinta sm:text-8xl"
              aria-hidden="true"
            >
              H
            </span>
            <span
              className="absolute top-3 right-3 size-3 rounded-full bg-rojo sm:size-4"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 left-0 size-10 rounded-tr-2xl bg-azul sm:size-14"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl leading-tight font-bold tracking-tight text-azul sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("intro")}</p>
          </div>
        </section>

        {/* Quién */}
        <section className="mt-14 flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("whoTitle")}
          </h2>
          <div className="flex max-w-2xl flex-col gap-4 text-base leading-relaxed text-foreground sm:text-lg">
            <p>{t("who1")}</p>
            <p>{t("who2")}</p>
            <p>{t("who3")}</p>
          </div>
        </section>

        {/* Por qué */}
        <section className="mt-12 rounded-3xl bg-secondary px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("whyTitle")}
          </h2>
          <div className="mt-4 flex max-w-2xl flex-col gap-4 text-base leading-relaxed text-foreground sm:text-lg">
            <p>{t("why1")}</p>
            {hasWhy2 && <p>{t("why2")}</p>}
          </div>
        </section>

        {/* Contacto */}
        <section
          id="contatto"
          className="mt-12 scroll-mt-6 rounded-3xl bg-azul px-6 py-10 text-white sm:px-10 sm:py-12"
        >
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {t("contactTitle")}
          </h2>
          <p className="mt-3 max-w-xl text-lg text-white/90">{t("contactBody")}</p>
          <p className="mt-4 inline-block rounded-full bg-amarillo px-4 py-1.5 text-sm font-medium text-tinta">
            {t("freeTrial")}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <span className="text-sm text-white/80">{t("emailLabel")}</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
                className: "h-11 w-full px-6 text-base sm:w-auto sm:self-start",
              })}
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
