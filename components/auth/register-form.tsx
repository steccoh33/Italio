"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

export function RegisterForm() {
  const t = useTranslations("Register");
  const tAuth = useTranslations("Auth");
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div className="inline-flex self-center rounded-full border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setRole("teacher")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            role === "teacher"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("teacherTab")}
        </button>
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            role === "student"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("studentTab")}
        </button>
      </div>

      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">{tAuth("fullNameLabel")}</Label>
        <Input id="fullName" name="fullName" type="text" required />
      </div>

      {role === "student" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="teacherCode">{tAuth("teacherCodeLabel")}</Label>
          <Input
            id="teacherCode"
            name="teacherCode"
            type="text"
            placeholder="MRC-482"
            className="uppercase"
            required
          />
          <p className="text-xs text-muted-foreground">
            {tAuth("teacherCodeHint")}
          </p>
        </div>
      )}

      {state.error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending
          ? tAuth("submitting")
          : role === "teacher"
            ? t("teacherSubmit")
            : t("studentSubmit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-azul hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
