import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentYear } from "@/lib/current-year";
import { buttonVariants } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { HeroReveal } from "@/components/landing/hero-reveal";

export default async function Home() {
  const locale = await getLocale();

  // The landing is only for visitors without a session.
  const profile = await getCurrentProfile();
  if (profile) {
    return redirect({ href: "/panel", locale });
  }

  const t = await getTranslations("HomePage");
  const tCorrection = await getTranslations("Correction");
  const year = getCurrentYear();

  const features = [
    { number: "01", title: t("f1Title"), body: t("f1Body"), style: "bg-azul text-white", numberStyle: "bg-white/15 text-white", bodyStyle: "text-white/85" },
    { number: "02", title: t("f2Title"), body: t("f2Body"), style: "bg-amarillo text-tinta", numberStyle: "bg-tinta/10 text-tinta", bodyStyle: "text-tinta/80" },
    { number: "03", title: t("f3Title"), body: t("f3Body"), style: "border border-border bg-card text-foreground", numberStyle: "bg-rojo/15 text-rojo", bodyStyle: "text-muted-foreground" },
  ];

  const schoolItems = [t("schoolsItem1"), t("schoolsItem2"), t("schoolsItem3")];

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-heading text-2xl font-bold tracking-tight text-azul">
          Italio
        </span>
        <LocaleSwitcher />
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-16 sm:pt-14 sm:pb-24">
          <HeroReveal>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col gap-6">
                <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-azul sm:text-6xl">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                  {t("heroSubtitle")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/registro"
                    className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base sm:w-auto" })}
                  >
                    {t("signUp")}
                  </Link>
                  <Link
                    href="/login"
                    className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-6 text-base sm:w-auto" })}
                  >
                    {t("signIn")}
                  </Link>
                </div>
              </div>

              {/* Visual: mascot placeholder + a sample correction */}
              <div className="relative mx-auto w-full max-w-md pb-10 sm:pb-12">
                <div
                  className="relative flex aspect-square w-full items-center justify-center rounded-[2rem] bg-amarillo"
                  role="img"
                  aria-label={t("mascotAlt")}
                >
                  <span className="text-8xl sm:text-9xl" aria-hidden="true">
                    🦜
                  </span>
                  <span className="absolute top-6 right-6 size-4 rounded-full bg-rojo" />
                  <span className="absolute bottom-0 left-0 size-24 rounded-tr-[2rem] bg-azul sm:size-28" aria-hidden="true" />
                </div>

                <div className="absolute right-0 bottom-0 left-6 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:left-10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("sampleLabel")}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {tCorrection("verdictAt", { level: "B1" })}
                    </span>
                  </div>
                  <p lang="it" className="text-sm text-foreground">
                    Ieri io{" "}
                    <span className="text-rojo line-through">ho andato</span>{" "}
                    <span className="font-medium text-azul">sono andato</span> al cinema.
                  </p>
                </div>
              </div>
            </div>
          </HeroReveal>
        </section>

        {/* Three featured blocks */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-12 sm:pb-16">
          <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("featuresTitle")}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.number}
                className={`flex flex-col gap-4 rounded-3xl p-6 sm:p-7 ${feature.style}`}
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
              </li>
            ))}
          </ul>

          {/* Fourth, more discreet */}
          <p className="mt-4 rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground sm:text-base">
            <span className="font-medium text-foreground">{t("extraLead")}</span>{" "}
            {t("extraBody")}
          </p>
        </section>

        {/* Schools and teachers */}
        <section className="border-y border-border bg-secondary">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("schoolsTitle")}
              </h2>
              <p className="max-w-lg text-lg text-muted-foreground">
                {t("schoolsBody")}
              </p>
              <Link
                href="/registro"
                className={buttonVariants({ size: "lg", className: "mt-2 h-11 self-start px-6 text-base" })}
              >
                {t("signUp")}
              </Link>
            </div>
            <ul className="flex flex-col gap-3 self-center">
              {schoolItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 text-base text-foreground"
                >
                  <span className="size-2.5 shrink-0 rounded-full bg-rojo" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final call */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex flex-col items-start gap-6 rounded-[2rem] bg-azul px-6 py-12 text-white sm:px-12 sm:py-16">
            <h2 className="max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              {t("finalTitle")}
            </h2>
            <p className="text-lg text-white/85">{t("finalBody")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className={buttonVariants({ size: "lg", variant: "secondary", className: "h-11 px-6 text-base" })}
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
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-heading text-xl font-bold tracking-tight text-azul">
              Italio
            </span>
            <span className="text-sm text-muted-foreground">
              © {year} Italio. {t("footerRights")}
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            {/* Placeholders: the real pages are still to be written. */}
            <a href="#" className="hover:text-foreground">
              {t("privacy")}
            </a>
            <a href="#" className="hover:text-foreground">
              {t("terms")}
            </a>
          </nav>
          <LocaleSwitcher />
        </div>
      </footer>
    </div>
  );
}
