"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteAssignmentAction } from "@/lib/auth/assignment-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssignmentForm } from "@/components/teacher/assignment-form";

export function AssignmentControls({
  classId,
  assignment,
}: {
  classId: string;
  assignment: {
    id: string;
    title: string;
    instructions: string;
    due_date: string | null;
  };
}) {
  const t = useTranslations("Assignments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAssignmentAction(assignment.id);
      setConfirmDelete(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/teacher/classes/${classId}`);
    });
  }

  if (editing) {
    return (
      <AssignmentForm
        classId={classId}
        assignment={assignment}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
          {t("edit")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setConfirmDelete(true)}
        >
          {t("delete")}
        </Button>
      </div>

      {error && <p className="text-sm text-rojo-texto">{error}</p>}

      <Dialog
        open={confirmDelete}
        onOpenChange={(open: boolean) => setConfirmDelete(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmBody", { title: assignment.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
