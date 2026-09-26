"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const t = useTranslations("Login");
  const tAuth = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loginCode">{tAuth("loginCodeLabel")}</Label>
        <Input
          id="loginCode"
          name="loginCode"
          type="text"
          placeholder="mela-fiume-verde"
          className="lowercase"
          autoComplete="off"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo/10 px-3 py-2 text-sm text-rojo-texto">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? tAuth("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/registro"
          className="font-medium text-azul hover:underline"
        >
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
