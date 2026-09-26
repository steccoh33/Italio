import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { Mascotte } from "@/components/public/mascotte";
import { LIFT, PublicShell } from "@/components/public/public-shell";

const CONTACT_EMAIL = "steccoh88@gmail.com";

export async function generateMetadata() {
  const t = await getTranslations("About");
  return { title: t("metaTitle") };
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  const hasWhy2 = t.has("why2");

  return (
    <PublicShell width="max-w-4xl">
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 pt-10 pb-16 sm:pt-14">
        {/* Presentación */}
        <section className="grid items-center gap-8 sm:grid-cols-[auto_1fr] sm:gap-12">
          <Mascotte variant="about" />
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl leading-tight font-bold tracking-tight text-marca sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("intro")}</p>
          </div>
        </section>

        {/* Quién */}
        <Reveal className="mt-14 flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("whoTitle")}
          </h2>
          <div className="flex max-w-2xl flex-col gap-4 text-base leading-relaxed text-foreground sm:text-lg">
            <p>{t("who1")}</p>
            <p>{t("who2")}</p>
            <p>{t("who3")}</p>
          </div>
        </Reveal>

        {/* Por qué */}
        <Reveal className="mt-12">
          <section className="rounded-3xl bg-secondary px-6 py-8 sm:px-10 sm:py-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("whyTitle")}
            </h2>
            <div className="mt-4 flex max-w-2xl flex-col gap-4 text-base leading-relaxed text-foreground sm:text-lg">
              <p>{t("why1")}</p>
              {hasWhy2 && <p>{t("why2")}</p>}
            </div>
          </section>
        </Reveal>

        {/* Contacto */}
        <Reveal className="mt-12">
          <section
            id="contatto"
            className="scroll-mt-6 rounded-3xl bg-azul-fondo px-6 py-10 text-white sm:px-10 sm:py-12"
          >
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {t("contactTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-lg text-white/95">{t("contactBody")}</p>
            <p className="mt-4 inline-block rounded-full bg-amarillo px-4 py-1.5 text-sm font-medium text-tinta">
              {t("freeTrial")}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <span className="text-sm text-white/95">{t("emailLabel")}</span>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={buttonVariants({
                  size: "lg",
                  variant: "secondary",
                  className: `h-11 w-full px-6 text-base sm:w-auto sm:self-start ${LIFT}`,
                })}
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </PublicShell>
  );
}
