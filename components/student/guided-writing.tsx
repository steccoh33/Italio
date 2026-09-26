"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  guidedTurnAction,
  proposeConsignaAction,
  startGuidedSessionAction,
} from "@/lib/auth/guided-actions";
import type { TutorMessage } from "@/lib/ai/guided-tutor";
import type { CilsLevel } from "@/lib/types/profile";
import { Button } from "@/components/ui/button";
import { WritingForm } from "@/components/student/writing-form";

// Mirrors MAX_CONSIGNA_PROPOSALS in the tutor module (server-enforced too).
const MAX_PROPOSALS = 4;

type Stage = "idle" | "proposal" | "chat";

export function GuidedWriting({ targetLevel }: { targetLevel: CilsLevel }) {
  const t = useTranslations("GuidedWriting");
  const [stage, setStage] = useState<Stage>("idle");
  const [proposals, setProposals] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [validAnswers, setValidAnswers] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const consigna = proposals.length > 0 ? proposals[proposals.length - 1] : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending, ready, proposals]);

  function requestProposal() {
    setError(null);
    startTransition(async () => {
      const result = await proposeConsignaAction(proposals);
      if (result.error || !result.consigna) {
        setError(result.error);
        return;
      }
      setProposals((prev) => [...prev, result.consigna as string]);
      setStage("proposal");
    });
  }

  function requestTurn(history: TutorMessage[]) {
    setError(null);
    startTransition(async () => {
      const result = await guidedTurnAction({
        history,
        consigna,
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
      setMessages([...history, { role: "tutor", text: turn.message }]);
      if (turn.phase === "ready_to_write") {
        setReady(true);
      }
    });
  }

  function handleAccept() {
    if (!consigna) return;
    setError(null);
    startTransition(async () => {
      const session = await startGuidedSessionAction(consigna);
      if (session.error || !session.sessionId) {
        setError(session.error);
        return;
      }
      setSessionId(session.sessionId);
      setStage("chat");

      const result = await guidedTurnAction({
        history: [],
        consigna,
        validAnswers: 0,
      });
      if (result.error || !result.turn) {
        setError(result.error);
        return;
      }
      setMessages([{ role: "tutor", text: result.turn.message }]);
    });
  }

  function handleSend() {
    const text = input.trim();
    if (!text || isPending || ready) return;
    const history: TutorMessage[] = [...messages, { role: "student", text }];
    setMessages(history);
    setInput("");
    requestTurn(history);
  }

  function handleRestart() {
    setStage("idle");
    setProposals([]);
    setSessionId(null);
    setMessages([]);
    setReady(false);
    setValidAnswers(0);
    setInput("");
    setError(null);
  }

  const errorBox = error && (
    <div className="flex flex-col gap-2 rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2">
      <p className="text-sm text-rojo-texto">{error}</p>
      {stage === "chat" && messages.length === 0 && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={handleAccept}
          disabled={isPending}
        >
          {t("retry")}
        </Button>
      )}
      {stage === "idle" && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={requestProposal}
          disabled={isPending}
        >
          {t("retry")}
        </Button>
      )}
    </div>
  );

  if (stage === "idle") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        {isPending && (
          <p className="text-sm text-muted-foreground">{t("proposing")}</p>
        )}
        {errorBox}
        <Button
          type="button"
          size="lg"
          onClick={requestProposal}
          disabled={isPending}
          className="self-start"
        >
          {t("start")}
        </Button>
      </div>
    );
  }

  if (stage === "proposal" && consigna) {
    const canAskAnother = proposals.length < MAX_PROPOSALS;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-azul/30 bg-azul/5 p-5">
          <p className="text-xs font-medium text-azul">{t("proposedTitle")}</p>
          <p lang="it" className="whitespace-pre-wrap text-base text-foreground">
            {consigna}
          </p>
        </div>

        {isPending && (
          <p className="text-sm text-muted-foreground">{t("proposing")}</p>
        )}
        {errorBox}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handleAccept} disabled={isPending}>
            {t("accept")}
          </Button>
          {canAskAnother && (
            <Button
              type="button"
              variant="secondary"
              onClick={requestProposal}
              disabled={isPending}
            >
              {t("another")}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {t("proposalCount", { n: proposals.length, max: MAX_PROPOSALS })}
          </span>
        </div>
        {!canAskAnother && (
          <p className="text-xs text-muted-foreground">{t("maxProposals")}</p>
        )}
        <div ref={endRef} />
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

        {errorBox}
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

      {ready && consigna && sessionId && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight text-marca">
            {t("writeNow")}
          </h2>
          <WritingForm
            targetLevel={targetLevel}
            fixedPrompt={{ title: t("consignaTitle"), text: consigna }}
            guided={{
              sessionId,
              planSummary: messages
                .filter((m) => m.role === "student")
                .map((m) => m.text)
                .join(" · ")
                .slice(0, 1000),
            }}
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
