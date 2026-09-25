"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AssignmentSummaryRow } from "@/lib/types/assignment";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/local-date-time";
import { AssignmentForm } from "@/components/teacher/assignment-form";

export function AssignmentsSection({
  classId,
  assignments,
}: {
  classId: string;
  assignments: AssignmentSummaryRow[];
}) {
  const t = useTranslations("Assignments");
  const [creating, setCreating] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("sectionTitle")}
        </h2>
        {!creating && (
          <Button type="button" onClick={() => setCreating(true)}>
            {t("newButton")}
          </Button>
        )}
      </div>

      {creating && (
        <AssignmentForm classId={classId} onDone={() => setCreating(false)} />
      )}

      {assignments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noAssignments")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link
                href={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-azul sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {assignment.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {assignment.due_date ? (
                      <>
                        {t("dueOn")} <LocalDateTime value={assignment.due_date} />
                      </>
                    ) : (
                      t("noDue")
                    )}
                  </span>
                </div>
                <span className="w-fit rounded-full bg-azul/10 px-3 py-1 text-xs font-medium text-azul">
                  {t("deliveries", {
                    done: assignment.delivered,
                    total: assignment.total,
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
