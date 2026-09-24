"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WritingWithCorrection } from "@/lib/types/writing";
import { Button } from "@/components/ui/button";
import { CorrectionResult } from "@/components/writing/correction-result";

const VERDICT_BADGE_CLASSES: Record<string, string> = {
  below: "bg-rojo/10 text-rojo",
  at: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  above: "bg-azul/10 text-azul",
};

export function WritingHistoryList({
  writings,
  emptyMessage,
}: {
  writings: WritingWithCorrection[];
  emptyMessage?: string;
}) {
  const t = useTranslations("Writing");
  const tCorrection = useTranslations("Correction");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (writings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? t("noHistory")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {writings.map((writing) => {
        const isExpanded = expandedId === writing.id;
        const createdAt = new Date(writing.created_at).toLocaleDateString(
          locale
        );

        return (
          <li
            key={writing.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("createdAt", { date: createdAt })}
                </span>
                {writing.status === "pending" && (
                  <span className="rounded-full bg-amarillo/20 px-2 py-0.5 text-xs font-medium text-tinta dark:text-foreground">
                    {t("statusPending")}
                  </span>
                )}
                {writing.status === "error" && (
                  <span className="rounded-full bg-rojo/10 px-2 py-0.5 text-xs font-medium text-rojo">
                    {t("statusError")}
                  </span>
                )}
                {writing.correction && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_BADGE_CLASSES[writing.correction.level_verdict]}`}
                  >
                    {tCorrection(
                      writing.correction.level_verdict === "below"
                        ? "verdictBelow"
                        : writing.correction.level_verdict === "at"
                          ? "verdictAt"
                          : "verdictAbove",
                      { level: writing.target_level }
                    )}
                  </span>
                )}
              </div>

              {writing.correction && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : writing.id)
                  }
                >
                  {isExpanded ? t("hideDetail") : t("viewDetail")}
                </Button>
              )}
            </div>

            {isExpanded && writing.correction && (
              <CorrectionResult
                originalText={writing.content}
                correction={writing.correction}
                targetLevel={writing.target_level}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
