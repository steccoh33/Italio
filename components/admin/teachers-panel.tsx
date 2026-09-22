"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  updateTeacherStatusAction,
  deleteTeachersAction,
} from "@/lib/auth/admin-actions";
import type { AdminTeacherRow, UserStatus } from "@/lib/types/profile";
import { Button } from "@/components/ui/button";
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
  paused: "bg-rojo/10 text-rojo",
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

export function AdminTeachersPanel({
  teachers,
}: {
  teachers: AdminTeacherRow[];
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminTeacherRow[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesStatus =
        statusFilter === "all" || teacher.status === statusFilter;
      const matchesSearch =
        query === "" || (teacher.full_name ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [teachers, search, statusFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((teacher) => selected.has(teacher.id));

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((teacher) => next.delete(teacher.id));
      } else {
        filtered.forEach((teacher) => next.add(teacher.id));
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
      const result = await updateTeacherStatusAction(ids, status);
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
    const ids = deleteTarget.map((teacher) => teacher.id);
    setError(null);
    startTransition(async () => {
      const result = await deleteTeachersAction(ids);
      setDeleteTarget(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      clearSelected(ids);
      router.refresh();
    });
  }

  const totalDeleteStudents =
    deleteTarget?.reduce((sum, teacher) => sum + teacher.student_count, 0) ?? 0;

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
                  teachers.filter((teacher) => selected.has(teacher.id))
                )
              }
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo">
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
          {filtered.map((teacher) => (
            <li
              key={teacher.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(teacher.id)}
                  onCheckedChange={() => toggleSelect(teacher.id)}
                  className="mt-1"
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {teacher.full_name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[teacher.status]}`}
                    >
                      {t(STATUS_LABEL_KEYS[teacher.status])}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t("teacherCodeLabel")}:{" "}
                      <span className="font-medium text-foreground">
                        {teacher.teacher_code}
                      </span>
                    </span>
                    <span>
                      {t("loginCodeLabel")}:{" "}
                      <span className="font-medium text-foreground">
                        {teacher.login_code}
                      </span>
                    </span>
                    <span>
                      {t("studentCount", { count: teacher.student_count })}
                    </span>
                  </div>
                  {teacher.status === "paused" && (
                    <p className="text-xs text-rojo">{t("pauseWarning")}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                {teacher.status === "pending" && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => runStatusChange([teacher.id], "active")}
                  >
                    {t("approve")}
                  </Button>
                )}
                {teacher.status === "active" && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => runStatusChange([teacher.id], "paused")}
                    >
                      {t("pause")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setDeleteTarget([teacher])}
                    >
                      {t("delete")}
                    </Button>
                  </>
                )}
                {teacher.status === "paused" && (
                  <>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => runStatusChange([teacher.id], "active")}
                    >
                      {t("reactivate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setDeleteTarget([teacher])}
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
                    studentCount: deleteTarget[0].student_count,
                  })
                : t("deleteConfirmBulk", {
                    teacherCount: deleteTarget?.length ?? 0,
                    studentCount: totalDeleteStudents,
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
