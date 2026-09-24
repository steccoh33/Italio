import { useTranslations } from "next-intl";
import type { CorrectionPayload } from "@/lib/types/writing";

const VERDICT_STYLES: Record<CorrectionPayload["level_verdict"], string> = {
  below: "border-rojo/30 bg-rojo/10 text-rojo",
  at: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  above: "border-azul/30 bg-azul/10 text-azul",
};

const VERDICT_LABEL_KEYS: Record<CorrectionPayload["level_verdict"], string> = {
  below: "verdictBelow",
  at: "verdictAt",
  above: "verdictAbove",
};

const ASSESSMENT_DIMENSIONS = [
  "adeguatezza",
  "morfosintassi",
  "lessico",
  "coesione",
] as const;

export function CorrectionResult({
  originalText,
  correction,
  targetLevel,
}: {
  originalText: string;
  correction: CorrectionPayload;
  targetLevel: string;
}) {
  const t = useTranslations("Correction");

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`rounded-2xl border px-5 py-4 text-center font-heading text-xl font-bold tracking-tight ${VERDICT_STYLES[correction.level_verdict]}`}
      >
        {t(VERDICT_LABEL_KEYS[correction.level_verdict], {
          level: targetLevel,
        })}
        <p className="mt-1 text-sm font-normal">
          {t("demonstratedLevel", { level: correction.level_demonstrated })}
        </p>
      </div>

      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
        {correction.general_comment}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {t("originalTextTitle")}
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {originalText}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {t("correctedTextTitle")}
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {correction.corrected_text}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          {t("assessmentTitle")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ASSESSMENT_DIMENSIONS.map((dimension) => (
            <div
              key={dimension}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t(dimension)}
                </span>
                <span className="font-heading text-lg font-bold text-azul">
                  {correction.assessment[dimension].voto}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {correction.assessment[dimension].commento}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          {t("errorsTitle")}
        </p>
        {correction.errors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noErrors")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {correction.errors.map((item, index) => (
              <li
                key={index}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amarillo/20 px-2 py-0.5 text-xs font-medium text-tinta dark:text-foreground">
                    {item.tipo}
                  </span>
                  <span className="text-sm text-rojo line-through">
                    {item.fragmento}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    → {item.correzione}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.spiegazione}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
