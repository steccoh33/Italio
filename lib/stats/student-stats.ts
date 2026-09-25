export type DimKey = "adeguatezza" | "morfosintassi" | "lessico" | "coesione";
export type ErrorCategory =
  | "morfosintassi"
  | "lessico"
  | "ortografia"
  | "coesione"
  | "adeguatezza"
  | "altro";
export type Trend = "up" | "same" | "down";
export type Verdict = "below" | "at" | "above";

export const DIMENSIONS: DimKey[] = [
  "adeguatezza",
  "morfosintassi",
  "lessico",
  "coesione",
];

/** Con menos textos corregidos que esto no se calcula evolución. */
export const MIN_TEXTS_FOR_EVOLUTION = 5;
/** Cambio mínimo en el promedio de una dimensión (escala 1-10) para hablar de mejora o retroceso. */
const DIMENSION_THRESHOLD = 0.3;
/** Cambio mínimo en errores por texto para hablar de mejora o retroceso. */
const ERRORS_PER_TEXT_THRESHOLD = 0.5;
/** Diferencia mínima entre la dimensión más alta y la más baja para marcar fortaleza/debilidad. */
const STRENGTH_MIN_SPREAD = 0.05;

export type StatsWriting = {
  created_at: string;
  assignment_id: string | null;
  guided_session_id: string | null;
  assessment: Partial<Record<DimKey, { voto?: number }>> | null;
  level_verdict: Verdict;
  errors: { tipo?: string }[] | null;
};

export type DimensionEvolution = {
  key: DimKey;
  first: number;
  last: number;
  trend: Trend;
};

export type ErrorEvolution = {
  category: ErrorCategory;
  first: number;
  last: number;
  /** "up" = mejoró (menos errores por texto). */
  trend: Trend;
};

export type StudentStats = {
  totals: {
    texts: number;
    assignments: number;
    guided: number;
    lastTextAt: string | null;
  };
  dimensions: { key: DimKey; avg: number }[];
  strength: DimKey | null;
  weakness: DimKey | null;
  verdicts: Record<Verdict, number>;
  errorRanking: { category: ErrorCategory; count: number }[];
  totalErrors: number;
  enoughForEvolution: boolean;
  evolution: null | {
    firstCount: number;
    lastCount: number;
    dimensions: DimensionEvolution[];
    errorsPerText: ErrorEvolution[];
    totalErrorsPerText: { first: number; last: number; trend: Trend };
  };
  /** Tendencia general, solo si hay evolución. */
  overallTrend: "improving" | "stable" | "declining" | null;
};

/** Agrupa el campo libre "tipo" de cada error en categorías amplias. */
export function categorizeError(tipo: string | undefined | null): ErrorCategory {
  if (!tipo) return "altro";
  const normalized = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  // Types like "lessico/morfosintassi" count for the first one named.
  const first = normalized.split(/[\/,;]/)[0].trim();

  if (/morfo|sintass|grammat|verb|accord|articol|preposiz|pronom|ausiliar|concord|genere|numero|coniug|tempo/.test(first)) {
    return "morfosintassi";
  }
  if (/less|vocab|parol|termin|significat|registro lessic/.test(first)) {
    return "lessico";
  }
  if (/ortogra|punteg|accent|apostrof|maiusc|grafi|spell/.test(first)) {
    return "ortografia";
  }
  if (/coes|connett|coeren|testual/.test(first)) {
    return "coesione";
  }
  if (/adegu|registro|consegna|lunghezza|argomento/.test(first)) {
    return "adeguatezza";
  }
  return "altro";
}

function trendOf(delta: number, threshold: number): Trend {
  if (delta >= threshold) return "up";
  if (delta <= -threshold) return "down";
  return "same";
}

function mean(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, v) => sum + v, 0) / values.length;
}

function dimensionAverages(writings: StatsWriting[]): Record<DimKey, number> {
  const result = {} as Record<DimKey, number>;
  for (const key of DIMENSIONS) {
    const votes = writings
      .map((w) => w.assessment?.[key]?.voto)
      .filter((v): v is number => typeof v === "number");
    result[key] = mean(votes);
  }
  return result;
}

function errorCounts(writings: StatsWriting[]): Map<ErrorCategory, number> {
  const counts = new Map<ErrorCategory, number>();
  for (const w of writings) {
    for (const error of w.errors ?? []) {
      const category = categorizeError(error?.tipo);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Calcula las estadísticas de un alumno a partir de sus escritos ya corregidos
 * (libres, de tarea y guiados). Función pura: no toca la base.
 */
export function computeStudentStats(input: StatsWriting[]): StudentStats {
  const writings = [...input].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
  );
  const n = writings.length;

  const assignments = new Set(
    writings.map((w) => w.assignment_id).filter((id): id is string => !!id)
  );
  const guided = new Set(
    writings.map((w) => w.guided_session_id).filter((id): id is string => !!id)
  );

  const averages = dimensionAverages(writings);
  const dimensions = DIMENSIONS.map((key) => ({ key, avg: averages[key] }));

  let strength: DimKey | null = null;
  let weakness: DimKey | null = null;
  if (n > 0) {
    const sorted = [...dimensions].sort((a, b) => b.avg - a.avg);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top.avg - bottom.avg >= STRENGTH_MIN_SPREAD) {
      strength = top.key;
      weakness = bottom.key;
    }
  }

  const verdicts: Record<Verdict, number> = { below: 0, at: 0, above: 0 };
  for (const w of writings) {
    if (w.level_verdict in verdicts) verdicts[w.level_verdict] += 1;
  }

  const counts = errorCounts(writings);
  const errorRanking = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const totalErrors = errorRanking.reduce((sum, e) => sum + e.count, 0);

  const enoughForEvolution = n >= MIN_TEXTS_FOR_EVOLUTION;
  let evolution: StudentStats["evolution"] = null;
  let overallTrend: StudentStats["overallTrend"] = null;

  if (enoughForEvolution) {
    const mid = Math.floor(n / 2);
    const firstHalf = writings.slice(0, mid);
    const lastHalf = writings.slice(mid);

    const firstAvg = dimensionAverages(firstHalf);
    const lastAvg = dimensionAverages(lastHalf);
    const dimEvolution: DimensionEvolution[] = DIMENSIONS.map((key) => ({
      key,
      first: firstAvg[key],
      last: lastAvg[key],
      trend: trendOf(lastAvg[key] - firstAvg[key], DIMENSION_THRESHOLD),
    }));

    const firstErrors = errorCounts(firstHalf);
    const lastErrors = errorCounts(lastHalf);
    const categories = new Set<ErrorCategory>([
      ...firstErrors.keys(),
      ...lastErrors.keys(),
    ]);
    const errEvolution: ErrorEvolution[] = [...categories]
      .map((category) => {
        const first = (firstErrors.get(category) ?? 0) / firstHalf.length;
        const last = (lastErrors.get(category) ?? 0) / lastHalf.length;
        // Fewer errors per text = improvement.
        return {
          category,
          first,
          last,
          trend: trendOf(first - last, ERRORS_PER_TEXT_THRESHOLD),
        };
      })
      .sort((a, b) => b.first + b.last - (a.first + a.last));

    const totalFirst =
      [...firstErrors.values()].reduce((s, v) => s + v, 0) / firstHalf.length;
    const totalLast =
      [...lastErrors.values()].reduce((s, v) => s + v, 0) / lastHalf.length;
    const totalTrend = trendOf(totalFirst - totalLast, ERRORS_PER_TEXT_THRESHOLD);

    evolution = {
      firstCount: firstHalf.length,
      lastCount: lastHalf.length,
      dimensions: dimEvolution,
      errorsPerText: errEvolution,
      totalErrorsPerText: { first: totalFirst, last: totalLast, trend: totalTrend },
    };

    const score =
      dimEvolution.filter((d) => d.trend === "up").length -
      dimEvolution.filter((d) => d.trend === "down").length +
      (totalTrend === "up" ? 1 : totalTrend === "down" ? -1 : 0);
    overallTrend = score > 0 ? "improving" : score < 0 ? "declining" : "stable";
  }

  return {
    totals: {
      texts: n,
      assignments: assignments.size,
      guided: guided.size,
      lastTextAt: n > 0 ? writings[n - 1].created_at : null,
    },
    dimensions,
    strength,
    weakness,
    verdicts,
    errorRanking,
    totalErrors,
    enoughForEvolution,
    evolution,
    overallTrend,
  };
}
