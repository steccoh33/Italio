"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { GuidedSessionRow } from "@/lib/types/guided";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/local-date-time";
import { CorrectionResult } from "@/components/writing/correction-result";

const VERDICT_BADGE_CLASSES: Record<string, string> = {
  below: "bg-rojo/10 text-rojo",
  at: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  above: "bg-azul/10 text-azul",
};

const VERDICT_KEYS: Record<string, string> = {
  below: "verdictBelow",
  at: "verdictAt",
  above: "verdictAbove",
};

export function GuidedSessionsList({
  sessions,
  emptyMessage,
}: {
  sessions: GuidedSessionRow[];
  emptyMessage: string;
}) {
  const t = useTranslations("GuidedWriting");
  const tCorrection = useTranslations("Correction");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => {
        const isExpanded = expandedId === session.id;
        const correction = session.writing.correction;

        return (
          <li
            key={session.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  <LocalDateTime value={session.completed_at ?? session.created_at} />
                </span>
                {correction && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_BADGE_CLASSES[correction.level_verdict]}`}
                  >
                    {tCorrection(VERDICT_KEYS[correction.level_verdict], {
                      level: session.target_level,
                    })}
                  </span>
                )}
              </div>
              <p lang="it" className="text-sm font-medium text-foreground">
                {session.prompt_text}
              </p>
            </div>

            {correction && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                {isExpanded ? t("hideSession") : t("viewSession")}
              </Button>
            )}

            {isExpanded && correction && (
              <div className="flex flex-col gap-4">
                {session.plan_summary && (
                  <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("planSummary")}
                    </p>
                    <p lang="it" className="whitespace-pre-wrap text-sm text-foreground">
                      {session.plan_summary}
                    </p>
                  </div>
                )}
                <CorrectionResult
                  originalText={session.writing.content}
                  correction={correction}
                  targetLevel={session.target_level}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
