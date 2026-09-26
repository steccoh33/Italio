"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  renameClassAction,
  deleteClassAction,
  updateClassMembershipAction,
} from "@/lib/auth/class-actions";
import type { ClassMemberRow } from "@/lib/types/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ClassDetailPanel({
  classId,
  initialName,
  roster,
}: {
  classId: string;
  initialName: string;
  roster: ClassMemberRow[];
}) {
  const t = useTranslations("Classes");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(roster.filter((student) => student.isMember).map((s) => s.id))
  );
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersSaved, setMembersSaved] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleStudent(id: string) {
    setMembersSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSaveName() {
    setNameError(null);
    setNameSaved(false);
    startTransition(async () => {
      const result = await renameClassAction(classId, name);
      if (result.error) {
        setNameError(result.error);
        return;
      }
      setNameSaved(true);
      router.refresh();
    });
  }

  function handleSaveMembers() {
    setMembersError(null);
    setMembersSaved(false);
    startTransition(async () => {
      const result = await updateClassMembershipAction(
        classId,
        Array.from(selected)
      );
      if (result.error) {
        setMembersError(result.error);
        return;
      }
      setMembersSaved(true);
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      const result = await deleteClassAction(classId);
      setConfirmDelete(false);
      if (result.error) {
        setMembersError(result.error);
        return;
      }
      router.push("/teacher/classes");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
        <Label htmlFor="className">{t("createLabel")}</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            id="className"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameSaved(false);
            }}
            className="flex-1"
          />
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSaveName}
            className="sm:w-auto"
          >
            {nameSaved ? t("savedFeedback") : t("saveNameButton")}
          </Button>
        </div>
        {nameError && <p className="text-sm text-rojo-texto">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("membersTitle")}
        </h2>

        {roster.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {t("noStudents")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roster.map((student) => (
              <li
                key={student.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <Checkbox
                  checked={selected.has(student.id)}
                  onCheckedChange={() => toggleStudent(student.id)}
                />
                <span className="text-sm font-medium text-foreground">
                  {student.full_name}
                </span>
              </li>
            ))}
          </ul>
        )}

        {membersError && <p className="text-sm text-rojo-texto">{membersError}</p>}

        <Button
          type="button"
          disabled={isPending || roster.length === 0}
          onClick={handleSaveMembers}
          className="self-start"
        >
          {membersSaved ? t("savedFeedback") : t("saveMembersButton")}
        </Button>
      </div>

      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={() => setConfirmDelete(true)}
        className="self-start"
      >
        {t("deleteButton")}
      </Button>

      <Dialog
        open={confirmDelete}
        onOpenChange={(open: boolean) => setConfirmDelete(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmBody", { name })}
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
              onClick={handleConfirmDelete}
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
