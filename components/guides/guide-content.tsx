import { useTranslations } from "next-intl";
import type { Guide, GuideLocale } from "@/lib/guides/guides-content";
import { CopyExampleButton } from "@/components/guides/copy-example-button";

/** Cuerpo completo de una guía (sin título): lo comparten la página de guías y el panel lateral de escribir. */
export function GuideContent({
  guide,
  locale,
}: {
  guide: Guide;
  locale: GuideLocale;
}) {
  const t = useTranslations("Guides");

  const sections = [
    { key: "start", label: t("start"), text: guide.structure.start[locale] },
    {
      key: "development",
      label: t("development"),
      text: guide.structure.development[locale],
    },
    { key: "end", label: t("end"), text: guide.structure.end[locale] },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xs font-medium text-muted-foreground">
            {t("whatIsIt")}
          </h2>
          <p className="text-sm text-foreground">{guide.whatIsIt[locale]}</p>
        </section>
        <section className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xs font-medium text-muted-foreground">
            {t("register")}
          </h2>
          <p className="text-sm text-foreground">{guide.register[locale]}</p>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {t("structure")}
        </h2>
        <ol className="flex flex-col gap-3">
          {sections.map((section, index) => (
            <li
              key={section.key}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul-fondo font-heading text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-foreground">
                  {section.label}
                </h3>
                <p className="text-sm text-muted-foreground">{section.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {t("usefulPhrases")}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {guide.usefulPhrases.map((phrase) => (
            <li
              key={phrase}
              lang="it"
              className="rounded-full bg-amarillo/20 px-3 py-1 text-sm font-medium text-tinta dark:text-foreground"
            >
              {phrase}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border-2 border-azul/30 bg-azul/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight text-marca">
            {t("modelExample")}
          </h2>
          <CopyExampleButton text={guide.modelExample} />
        </div>
        <p lang="it" className="text-base leading-relaxed text-foreground">
          {guide.modelExample}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {t("commonMistakes")}
        </h2>
        <ul className="flex flex-col gap-2">
          {guide.commonMistakes.map((mistake, index) => (
            <li
              key={index}
              className="rounded-xl border border-rojo/30 bg-rojo/10 px-4 py-3 text-sm text-foreground"
            >
              {mistake[locale]}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
