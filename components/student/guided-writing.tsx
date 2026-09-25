"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { guidedTurnAction } from "@/lib/auth/guided-actions";
import type { TutorMessage } from "@/lib/ai/guided-tutor";
import type { CilsLevel } from "@/lib/types/profile";
import { Button } from "@/components/ui/button";
import { WritingForm } from "@/components/student/writing-form";

export function GuidedWriting({ targetLevel }: { targetLevel: CilsLevel }) {
  const t = useTranslations("GuidedWriting");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [consigna, setConsigna] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [validAnswers, setValidAnswers] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending, ready]);

  function requestTurn(history: TutorMessage[], currentConsigna: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await guidedTurnAction({
        history,
        consigna: currentConsigna,
        validAnswers,
      });

      if (result.error || !result.turn) {
        setError(result.error);
        return;
      }

      const { turn } = result;
      if (history.length > 0 && turn.answered) {
        setValidAnswers((n) => n + 1);
      }
      if (turn.consigna) {
        setConsigna(turn.consigna);
      }
      setMessages([...history, { role: "tutor", text: turn.message }]);
      if (turn.phase === "ready_to_write") {
        setReady(true);
      }
    });
  }

  function handleStart() {
    setStarted(true);
    requestTurn([], null);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || isPending || ready) return;
    const history: TutorMessage[] = [...messages, { role: "student", text }];
    setMessages(history);
    setInput("");
    requestTurn(history, consigna);
  }

  function handleRestart() {
    setStarted(false);
    setMessages([]);
    setConsigna(null);
    setReady(false);
    setValidAnswers(0);
    setInput("");
    setError(null);
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <Button type="button" size="lg" onClick={handleStart} className="self-start">
          {t("start")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {consigna && (
        <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-azul/30 bg-azul/5 p-5">
          <p className="text-xs font-medium text-azul">{t("consignaTitle")}</p>
          <p lang="it" className="whitespace-pre-wrap text-base text-foreground">
            {consigna}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1 ${
              message.role === "student" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {message.role === "student" ? t("youLabel") : t("tutorLabel")}
            </span>
            <p
              lang="it"
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                message.role === "student"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}

        {isPending && (
          <p className="text-sm text-muted-foreground">{t("thinking")}</p>
        )}

        {error && (
          <div className="flex flex-col gap-2 rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2">
            <p className="text-sm text-rojo">{error}</p>
            {messages.length === 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => requestTurn([], null)}
                disabled={isPending}
              >
                {t("retry")}
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!ready && messages.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={t("answerPlaceholder")}
            disabled={isPending}
            className="w-full min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={isPending || input.trim() === ""}
          >
            {t("send")}
          </Button>
        </div>
      )}

      {ready && consigna && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight text-azul">
            {t("writeNow")}
          </h2>
          <WritingForm
            targetLevel={targetLevel}
            fixedPrompt={{ title: t("consignaTitle"), text: consigna }}
          />
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleRestart}
        disabled={isPending}
        className="self-start"
      >
        {t("restart")}
      </Button>
    </div>
  );
}
