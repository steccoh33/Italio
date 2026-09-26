"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildReport, type Tone } from "@/lib/stats/report-model";
import { downloadReportPdf } from "@/lib/stats/stats-pdf";
import type { StudentStats } from "@/lib/stats/student-stats";
import { Button } from "@/components/ui/button";

const BAR_CLASSES: Record<Tone, string> = {
  good: "bg-menta",
  bad: "bg-rojo",
  same: "bg-muted-foreground/60",
  neutral: "bg-azul-fondo",
};

const TEXT_CLASSES: Record<Tone, string> = {
  good: "text-menta-texto",
  bad: "text-rojo-texto",
  same: "text-muted-foreground",
  neutral: "text-azul",
};

const BADGE_CLASSES: Record<Tone, string> = {
  good: "bg-menta/10 text-menta-texto",
  bad: "bg-rojo/10 text-rojo-texto",
  same: "bg-muted text-muted-foreground",
  neutral: "bg-azul/10 text-azul",
};

export function StudentStatsView({
  stats,
  studentName,
  targetLevelLabel,
}: {
  stats: StudentStats;
  studentName: string;
  targetLevelLabel: string;
}) {
  const t = useTranslations("Stats");
  const locale = useLocale();
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const report = useMemo(
    () =>
      buildReport({
        stats,
        t: (key, values) => t(key, values),
        locale,
        studentName,
        targetLevelLabel,
        now: new Date(),
      }),
    [stats, t, locale, studentName, targetLevelLabel]
  );

  async function handleDownload() {
    setPdfError(false);
    setDownloading(true);
    try {
      await downloadReportPdf(report);
    } catch {
      setPdfError(true);
    } finally {
      setDownloading(false);
    }
  }

  if (stats.totals.texts === 0 && stats.exercises.done === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="self-start"
        >
          {downloading ? t("generatingPdf") : t("downloadPdf")}
        </Button>
        {pdfError && <p className="text-sm text-rojo-texto">{t("pdfError")}</p>}
      </div>

      {report.sections.map((section, index) => (
        <section key={index} className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {section.heading}
          </h2>

          {section.type === "cards" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4"
                >
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-heading text-2xl font-bold tracking-tight text-marca">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {section.type === "text" && (
            <ul className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
              {section.lines.map((line) => (
                <li key={line} className="text-sm text-foreground">
                  {line}
                </li>
              ))}
            </ul>
          )}

          {section.type === "bars" &&
            (section.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                {section.empty}
              </p>
            ) : (
              <ul className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                {section.items.map((item) => {
                  return (
                    <li key={item.label} className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {item.label}
                          {item.badge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[item.badge.tone]}`}
                            >
                              {item.badge.text}
                            </span>
                          )}
                        </span>
                        <span className="font-heading text-lg font-bold text-foreground">
                          {item.valueText}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${BAR_CLASSES[item.tone]}`}
                          style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}

          {section.type === "trends" && (
            <div className="flex flex-col gap-3">
              {section.notice && (
                <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  {section.notice}
                </p>
              )}
              {section.items.length > 0 && (
                <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
                  {section.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <span className="text-sm text-foreground">
                        <span className="font-medium">{item.label}</span>
                        {": "}
                        {item.text}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-sm font-medium ${TEXT_CLASSES[item.tone]}`}
                      >
                        <span className="text-lg leading-none">{item.arrow}</span>
                        {item.verb}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
