"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  updateStudentStatusAction,
  deleteStudentsAction,
} from "@/lib/auth/teacher-actions";
import type { TeacherStudentRow, UserStatus } from "@/lib/types/profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StatusFilter = "all" | UserStatus;

const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  pending: "bg-amarillo/20 text-tinta dark:text-foreground",
  active: "bg-azul/10 text-azul",
  paused: "bg-rojo/10 text-rojo-texto",
};

const STATUS_LABEL_KEYS: Record<UserStatus, string> = {
  pending: "statusPending",
  active: "statusActive",
  paused: "statusPaused",
};

const FILTER_LABEL_KEYS: Record<StatusFilter, string> = {
  all: "filterAll",
  pending: "filterPending",
  active: "filterActive",
  paused: "filterPaused",
};

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "active", "paused"];

export function StudentsPanel({
  students,
}: {
  students: TeacherStudentRow[];
}) {
  const t = useTranslations("Teacher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<TeacherStudentRow[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const matchesSearch =
        query === "" || (student.full_name ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [students, search, statusFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((student) => selected.has(student.id));

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((student) => next.delete(student.id));
      } else {
        filtered.forEach((student) => next.add(student.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
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

  function clearSelected(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function runStatusChange(ids: string[], status: UserStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateStudentStatusAction(ids, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      clearSelected(ids);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const ids = deleteTarget.map((student) => student.id);
    setError(null);
    startTransition(async () => {
      const result = await deleteStudentsAction(ids);
      setDeleteTarget(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      clearSelected(ids);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-xs"
        />
        <div className="inline-flex flex-wrap gap-1 self-start rounded-full border border-border bg-card p-1">
          {STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(FILTER_LABEL_KEYS[value])}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {t("selectedCount", { count: selected.size })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => runStatusChange(Array.from(selected), "active")}
            >
              {t("approve")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => runStatusChange(Array.from(selected), "paused")}
            >
              {t("pause")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                setDeleteTarget(
                  students.filter((student) => selected.has(student.id))
                )
              }
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo-texto">
          {error}
        </p>
      )}

      {filtered.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allFilteredSelected}
            onCheckedChange={toggleSelectAll}
          />
          {t("selectAll")}
        </label>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((student) => (
            <li
              key={student.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(student.id)}
                  onCheckedChange={() => toggleSelect(student.id)}
                  className="mt-1"
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {student.full_name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[student.status]}`}
                    >
                      {t(STATUS_LABEL_KEYS[student.status])}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("loginCodeLabel")}:{" "}
                    <span className="font-medium text-foreground">
                      {student.login_code}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                <Link
                  href={`/teacher/students/${student.id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {t("viewWritingsButton")}
                </Link>
                {student.status === "pending" && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => runStatusChange([student.id], "active")}
                  >
                    {t("approve")}
                  </Button>
                )}
                {student.status === "active" && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => runStatusChange([student.id], "paused")}
                    >
                      {t("pause")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setDeleteTarget([student])}
                    >
                      {t("delete")}
                    </Button>
                  </>
                )}
                {student.status === "paused" && (
                  <>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => runStatusChange([student.id], "active")}
                    >
                      {t("reactivate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setDeleteTarget([student])}
                    >
                      {t("delete")}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {deleteTarget && deleteTarget.length === 1
                ? t("deleteConfirmSingle", {
                    name: deleteTarget[0].full_name ?? "",
                  })
                : t("deleteConfirmBulk", {
                    count: deleteTarget?.length ?? 0,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
