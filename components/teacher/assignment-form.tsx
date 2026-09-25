"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createAssignmentAction,
  updateAssignmentAction,
} from "@/lib/auth/assignment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** ISO -> valor para <input type="datetime-local"> en hora local del navegador. */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AssignmentForm({
  classId,
  assignment,
  onDone,
}: {
  classId: string;
  /** Si viene, el formulario edita esa tarea; si no, crea una nueva. */
  assignment?: {
    id: string;
    title: string;
    instructions: string;
    due_date: string | null;
  };
  onDone: () => void;
}) {
  const t = useTranslations("Assignments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [instructions, setInstructions] = useState(
    assignment?.instructions ?? ""
  );
  const [due, setDue] = useState(toLocalInputValue(assignment?.due_date ?? null));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const input = {
      title,
      instructions,
      // datetime-local has no timezone: interpret it in the browser's own.
      dueDate: due ? new Date(due).toISOString() : null,
    };

    startTransition(async () => {
      const result = assignment
        ? await updateAssignmentAction(assignment.id, input)
        : await createAssignmentAction(classId, input);

      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assignmentTitle">{t("titleLabel")}</Label>
        <Input
          id="assignmentTitle"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assignmentInstructions">{t("instructionsLabel")}</Label>
        <textarea
          id="assignmentInstructions"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          required
          rows={5}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assignmentDue">{t("dueLabel")}</Label>
        <Input
          id="assignmentDue"
          type="datetime-local"
          value={due}
          onChange={(event) => setDue(event.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {t("save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={onDone}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
