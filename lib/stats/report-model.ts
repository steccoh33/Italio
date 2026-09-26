import {
  DIMENSIONS,
  type DimKey,
  type ErrorCategory,
  type StudentStats,
  type Trend,
} from "@/lib/stats/student-stats";

export type Tone = "good" | "bad" | "same" | "neutral";

export type BarItem = {
  label: string;
  value: number;
  max: number;
  valueText: string;
  tone: Tone;
  badge?: { text: string; tone: Tone };
};

export type ReportSection =
  | { type: "cards"; heading: string; items: { label: string; value: string }[] }
  | { type: "text"; heading: string; lines: string[] }
  | {
      /** Barras horizontales: dimensiones (escala 1-10) o conteos (ranking, veredictos). */
      type: "bars";
      heading: string;
      empty?: string;
      items: BarItem[];
    }
  | {
      type: "trends";
      heading: string;
      notice?: string;
      items: {
        label: string;
        text: string;
        verb: string;
        arrow: "↗" | "→" | "↘";
        tone: Tone;
      }[];
    };

export type Report = {
  brand: string;
  title: string;
  studentName: string;
  levelLine: string;
  dateLine: string;
  fileName: string;
  sections: ReportSection[];
  pageLabel: string;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

const ARROW: Record<Trend, "↗" | "→" | "↘"> = { up: "↗", same: "→", down: "↘" };
const TONE: Record<Trend, Tone> = { up: "good", same: "same", down: "bad" };

/**
 * Convierte las estadísticas (números ya calculados en el servidor) en un
 * informe con textos traducidos. Lo usan la pantalla y el PDF, para que
 * muestren exactamente lo mismo.
 */
export function buildReport({
  stats,
  t,
  locale,
  studentName,
  targetLevelLabel,
  now,
}: {
  stats: StudentStats;
  t: Translate;
  locale: string;
  studentName: string;
  targetLevelLabel: string;
  now: Date;
}): Report {
  const num = (x: number) =>
    x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dim = (key: DimKey) => t(`dim.${key}`);
  const cat = (key: ErrorCategory) => t(`cat.${key}`);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });

  const sections: ReportSection[] = [];

  sections.push({
    type: "cards",
    heading: t("generalTitle"),
    items: [
      { label: t("textsLabel"), value: String(stats.totals.texts) },
      { label: t("assignmentsLabel"), value: String(stats.totals.assignments) },
      { label: t("guidedLabel"), value: String(stats.totals.guided) },
      {
        label: t("lastTextLabel"),
        value: stats.totals.lastTextAt ? date(stats.totals.lastTextAt) : "-",
      },
      { label: t("targetLevelLabel"), value: targetLevelLabel },
    ],
  });

  if (stats.totals.texts > 0) {
    // Summary: built only from the numbers, no AI.
    const lines: string[] = [];
    const avgOf = (key: DimKey) => stats.dimensions.find((d) => d.key === key)?.avg ?? 0;
    if (stats.strength) {
      lines.push(
        t("summaryStrength", { dimension: dim(stats.strength), avg: num(avgOf(stats.strength)) })
      );
    }
    if (stats.weakness) {
      lines.push(
        t("summaryWeakness", { dimension: dim(stats.weakness), avg: num(avgOf(stats.weakness)) })
      );
    }
    if (!stats.strength && !stats.weakness) {
      lines.push(t("summaryNoSpread"));
    }
    if (stats.errorRanking.length > 0) {
      lines.push(
        t("summaryTopError", {
          category: cat(stats.errorRanking[0].category),
          count: stats.errorRanking[0].count,
        })
      );
    }
    lines.push(
      stats.overallTrend
        ? t(`summaryTrend.${stats.overallTrend}`)
        : t("summaryTrend.notEnough")
    );
    sections.push({ type: "text", heading: t("summaryTitle"), lines });

    sections.push({
      type: "bars",
      heading: t("dimensionsTitle"),
      items: DIMENSIONS.map((key) => {
        const avg = avgOf(key);
        const badge =
          key === stats.strength
            ? { text: t("strengthBadge"), tone: "good" as const }
            : key === stats.weakness
              ? { text: t("weaknessBadge"), tone: "bad" as const }
              : undefined;
        return {
          label: dim(key),
          value: avg,
          max: 10,
          valueText: num(avg),
          tone: badge?.tone ?? ("neutral" as const),
          badge,
        };
      }),
    });

    const verdictMax = Math.max(
      stats.verdicts.below,
      stats.verdicts.at,
      stats.verdicts.above,
      1
    );
    const verdictItem = (key: "below" | "at" | "above", tone: Tone) => ({
      label: t(`verdict.${key}`),
      value: stats.verdicts[key],
      max: verdictMax,
      valueText: String(stats.verdicts[key]),
      tone,
    });
    sections.push({
      type: "bars",
      heading: t("verdictsTitle", { level: targetLevelLabel.split(" ")[0] }),
      items: [
        verdictItem("below", "bad"),
        verdictItem("at", "good"),
        verdictItem("above", "neutral"),
      ],
    });

    const errorMax = Math.max(...stats.errorRanking.map((e) => e.count), 1);
    sections.push({
      type: "bars",
      heading: t("errorsTitle"),
      empty: t("noErrors"),
      items: stats.errorRanking.map((e) => ({
        label: cat(e.category),
        value: e.count,
        max: errorMax,
        valueText: String(e.count),
        tone: "bad" as const,
      })),
    });

    if (!stats.evolution) {
      sections.push({
        type: "trends",
        heading: t("evolutionTitle"),
        notice: t("evolutionNotEnough"),
        items: [],
      });
    } else {
      const evo = stats.evolution;
      const items = [
        ...evo.dimensions.map((d) => ({
          label: dim(d.key),
          text: t("fromTo", { from: num(d.first), to: num(d.last) }),
          verb: t(`dimTrend.${d.trend}`),
          arrow: ARROW[d.trend],
          tone: TONE[d.trend],
        })),
        {
          label: t("errorsPerTextTotal"),
          text: t("fromTo", {
            from: num(evo.totalErrorsPerText.first),
            to: num(evo.totalErrorsPerText.last),
          }),
          verb: t(`errTrend.${evo.totalErrorsPerText.trend}`),
          arrow: ARROW[evo.totalErrorsPerText.trend],
          tone: TONE[evo.totalErrorsPerText.trend],
        },
        ...evo.errorsPerText.map((e) => ({
          label: t("errorsPerTextOf", { category: cat(e.category) }),
          text: t("fromTo", { from: num(e.first), to: num(e.last) }),
          verb: t(`errTrend.${e.trend}`),
          arrow: ARROW[e.trend],
          tone: TONE[e.trend],
        })),
      ];
      sections.push({
        type: "trends",
        heading: t("evolutionTitle"),
        notice: t("evolutionPeriods", { first: evo.firstCount, last: evo.lastCount }),
        items,
      });
    }

  }

  if (stats.exercises.done > 0) {
    const ex = stats.exercises;
    const pct = (x: number) => `${Math.round(x)}%`;
    sections.push({
      type: "cards",
      heading: t("exercisesTitle"),
      items: [
        { label: t("exercisesDone"), value: String(ex.done) },
        { label: t("exercisesAvg"), value: pct(ex.avgPercent) },
      ],
    });
    sections.push({
      type: "bars",
      heading: t("exercisesByType"),
      items: ex.byType.map((b) => ({
        label: `${t(`exType.${b.type}`)} (${b.count})`,
        value: b.avgPercent,
        max: 100,
        valueText: pct(b.avgPercent),
        tone: "neutral" as const,
      })),
    });
    sections.push({
      type: "trends",
      heading: t("exercisesEvolution"),
      notice: ex.evolution
        ? t("exercisesPeriods", {
            first: ex.evolution.firstCount,
            last: ex.evolution.lastCount,
          })
        : t("exercisesNotEnough"),
      items: ex.evolution
        ? [
            {
              label: t("exercisesAvg"),
              text: t("fromTo", {
                from: pct(ex.evolution.first),
                to: pct(ex.evolution.last),
              }),
              verb: t(`dimTrend.${ex.evolution.trend}`),
              arrow: ARROW[ex.evolution.trend],
              tone: TONE[ex.evolution.trend],
            },
          ]
        : [],
    });
  }

  const dateStamp = now.toISOString().slice(0, 10);
  return {
    brand: "Italio",
    title: t("reportTitle"),
    studentName,
    levelLine: `${t("targetLevelLabel")}: ${targetLevelLabel}`,
    dateLine: `${t("reportDate")}: ${now.toLocaleDateString(locale, { dateStyle: "long" })}`,
    fileName: `italio-${studentName.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-${dateStamp}.pdf`,
    pageLabel: t("pageLabel"),
    sections,
  };
}
