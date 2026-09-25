"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  submitWritingAction,
  type SubmitWritingState,
} from "@/lib/auth/writing-actions";
import { CILS_LEVEL_INFO } from "@/lib/cils-levels";
import type { CilsLevel } from "@/lib/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CorrectionResult } from "@/components/writing/correction-result";
import { GuideDrawer } from "@/components/guides/guide-drawer";

const initialState: SubmitWritingState = { error: null, result: null };

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export function WritingForm({ targetLevel }: { targetLevel: CilsLevel }) {
  const t = useTranslations("Writing");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [content, setContent] = useState("");
  const [submittedContent, setSubmittedContent] = useState("");
  const [state, formAction, pending] = useActionState(
    submitWritingAction,
    initialState
  );

  const info = CILS_LEVEL_INFO[targetLevel];
  const wordCount = useMemo(() => countWords(content), [content]);

  useEffect(() => {
    if (wasPending.current && !pending && state.result) {
      setSubmittedContent(content);
      setContent("");
      formRef.current?.reset();
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state, router, content]);

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      >
        <input type="hidden" name="targetLevel" value={targetLevel} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("targetLevelLabel")}
            </p>
            <p className="font-heading text-2xl font-bold tracking-tight text-azul">
              {info.label}
            </p>
          </div>
          <GuideDrawer targetLevel={targetLevel} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promptText">{t("promptLabel")}</Label>
          <Input
            id="promptText"
            name="promptText"
            type="text"
            placeholder={t("promptPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("promptHint")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">{t("contentLabel")}</Label>
          <textarea
            id="content"
            name="content"
            required
            rows={10}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{t("wordCount", { count: wordCount })}</span>
            <span>
              {t("expectedRange", {
                min: info.minWords,
                max: info.maxWords,
              })}
            </span>
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? t("correcting") : t("submit")}
        </Button>
      </form>

      {state.result && (
        <CorrectionResult
          originalText={submittedContent}
          correction={state.result}
          targetLevel={targetLevel}
        />
      )}
    </div>
  );
}
