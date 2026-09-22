"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ShareCodeCard({
  teacherCode,
  loginCode,
}: {
  teacherCode: string;
  loginCode: string;
}) {
  const t = useTranslations("Teacher");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(teacherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the
      // code is already shown on screen so this is a harmless no-op.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">
          {t("shareCodeTitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("shareCodeBody")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-heading text-3xl font-bold tracking-tight text-azul">
          {teacherCode}
        </span>
        <Button type="button" size="sm" onClick={handleCopy}>
          {copied ? t("copiedFeedback") : t("copyButton")}
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {t("ownLoginCodeLabel")}
        </p>
        <p className="text-sm font-medium text-foreground">{loginCode}</p>
      </div>
    </div>
  );
}
