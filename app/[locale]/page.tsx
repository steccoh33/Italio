import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { buttonVariants } from "@/components/ui/button";
import { HeroReveal } from "@/components/landing/hero-reveal";
import { Reveal } from "@/components/landing/reveal";
import { Mascotte } from "@/components/public/mascotte";
import { LIFT, PublicShell } from "@/components/public/public-shell";

export default async function Home() {
  const locale = await getLocale();

  // The landing is only for visitors without a session.
  const profile = await getCurrentProfile();
  if (profile) {
    return redirect({ href: "/panel", locale });
  }

  const t = await getTranslations("HomePage");
  const tCorrection = await getTranslations("Correction");

  const features = [
    { number: "01", title: t("f1Title"), body: t("f1Body"), style: "bg-azul-fondo text-white", numberStyle: "bg-white text-azul-fondo", bodyStyle: "text-white/95" },
    { number: "02", title: t("f2Title"), body: t("f2Body"), style: "border border-border bg-card text-foreground", numberStyle: "bg-amarillo text-tinta", bodyStyle: "text-muted-foreground" },
    { number: "03", title: t("f3Title"), body: t("f3Body"), style: "border border-border bg-card text-foreground", numberStyle: "bg-rojo/15 text-rojo-texto", bodyStyle: "text-muted-foreground" },
  ];

  const schoolItems = [t("schoolsItem1"), t("schoolsItem2"), t("schoolsItem3")];

  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-16 sm:pt-14 sm:pb-24">
        <HeroReveal>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-6">
              <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-marca sm:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className={buttonVariants({ size: "lg", className: `h-11 px-6 text-base sm:w-auto ${LIFT}` })}
                >
                  {t("signUp")}
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({ size: "lg", variant: "outline", className: `h-11 px-6 text-base sm:w-auto ${LIFT}` })}
                >
                  {t("signIn")}
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
                <Link href="/chi-siamo" className="text-azul underline-offset-4 hover:underline">
                  {t("about")}
                </Link>
                <Link href="/chi-siamo#contatto" className="text-azul underline-offset-4 hover:underline">
                  {t("contact")}
                </Link>
              </div>
            </div>

            {/* Visual: the mascot + a sample correction */}
            <div className="mx-auto flex w-full max-w-md flex-col">
              <Mascotte variant="hero" />

              <div className="relative mt-3 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:mx-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("sampleLabel")}
                  </span>
                  <span className="rounded-full bg-menta/10 px-2 py-0.5 text-xs font-medium text-menta-texto">
                    {tCorrection("verdictAt", { level: "B1" })}
                  </span>
                </div>
                <p lang="it" className="text-sm text-foreground">
                  Ieri io{" "}
                  <span className="text-rojo-texto line-through">ho andato</span>{" "}
                  <span className="font-medium text-menta-texto">sono andato</span> al cinema.
                </p>
              </div>
            </div>
          </div>
        </HeroReveal>
      </section>

      {/* Three featured blocks */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 sm:pb-16">
        <Reveal>
          <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("featuresTitle")}
          </h2>
        </Reveal>
        <ul className="grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <li key={feature.number}>
              <Reveal delay={index * 0.1} className="h-full">
                <div
                  className={`flex h-full flex-col gap-4 rounded-3xl p-6 sm:p-7 ${LIFT} ${feature.style}`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full font-heading text-sm font-bold ${feature.numberStyle}`}
                  >
                    {feature.number}
                  </span>
                  <h3 className="font-heading text-2xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className={`text-base leading-relaxed ${feature.bodyStyle}`}>
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Fourth, more discreet */}
        <Reveal delay={0.1} className="mt-4">
          <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground sm:text-base">
            <span className="font-medium text-foreground">{t("extraLead")}</span>{" "}
            {t("extraBody")}
          </p>
        </Reveal>
      </section>

      {/* Schools and teachers */}
      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal className="flex flex-col gap-4">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("schoolsTitle")}
            </h2>
            <p className="max-w-lg text-lg text-muted-foreground">
              {t("schoolsBody")}
            </p>
            <Link
              href="/registro"
              className={buttonVariants({ size: "lg", className: `mt-2 h-11 self-start px-6 text-base ${LIFT}` })}
            >
              {t("signUp")}
            </Link>
          </Reveal>
          <ul className="flex flex-col gap-3 self-center">
            {schoolItems.map((item, index) => (
              <li key={item}>
                <Reveal delay={0.1 + index * 0.1}>
                  <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 text-base text-foreground">
                    <span className="size-2.5 shrink-0 rounded-full bg-rojo" aria-hidden="true" />
                    {item}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final call */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <Reveal>
          <div className="flex flex-col items-start gap-6 rounded-[2rem] bg-azul-fondo px-6 py-12 text-white sm:px-12 sm:py-16">
            <h2 className="max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              {t("finalTitle")}
            </h2>
            <p className="text-lg text-white/95">{t("finalBody")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className={buttonVariants({ size: "lg", variant: "secondary", className: `h-11 px-6 text-base ${LIFT}` })}
              >
                {t("signUp")}
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-base font-medium text-white underline-offset-4 hover:underline"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
