"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClassAction, type CreateClassState } from "@/lib/auth/class-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateClassState = { error: null };

export function CreateClassForm() {
  const t = useTranslations("Classes");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [state, formAction, pending] = useActionState(
    createClassAction,
    initialState
  );

  // Server Actions driven by useActionState don't refetch the parent
  // Server Component's data on their own (unlike a redirect()). Once a
  // submission finishes without error, refresh so the new class shows
  // up in the list without a manual reload.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="name">{t("createLabel")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t("createPlaceholder")}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {t("createButton")}
      </Button>
      {state.error && (
        <p className="text-sm text-rojo sm:basis-full">{state.error}</p>
      )}
    </form>
  );
}
