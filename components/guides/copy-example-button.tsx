"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function CopyExampleButton({ text }: { text: string }) {
  const t = useTranslations("Guides");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the
      // text is on screen and selectable, so this is a harmless no-op.
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
      {copied ? t("copied") : t("copy")}
    </Button>
  );
}
