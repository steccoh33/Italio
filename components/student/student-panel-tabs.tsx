"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CilsLevel } from "@/lib/types/profile";
import type { WritingWithCorrection } from "@/lib/types/writing";
import { WritingForm } from "@/components/student/writing-form";
import { WritingHistoryList } from "@/components/writing/writing-history-list";

export function StudentPanelTabs({
  targetLevel,
  writings,
}: {
  targetLevel: CilsLevel;
  writings: WritingWithCorrection[];
}) {
  const t = useTranslations("Student");
  const [tab, setTab] = useState<"write" | "history">("write");

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex self-start rounded-full border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "write"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("writeTab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("historyTab")}
        </button>
      </div>

      {tab === "write" ? (
        <WritingForm targetLevel={targetLevel} />
      ) : (
        <WritingHistoryList writings={writings} />
      )}
    </div>
  );
}
