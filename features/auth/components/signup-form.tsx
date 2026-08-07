"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { registerAction } from "../actions";

/** Formulaire d'inscription — Server Action + codes d'erreur i18n. */
export function SignupForm() {
  const t = useTranslations("auth");
  const [errorCode, formAction, isPending] = useActionState(
    registerAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="signup-username">{t("username")}</Label>
        <Input
          id="signup-username"
          name="username"
          autoComplete="username"
          placeholder="frag-master"
          maxLength={20}
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">{t("email")}</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="player@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">{t("password")}</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          required
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm">{t("confirmPassword")}</Label>
        <Input
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          required
        />
      </div>

      {errorCode && (
        <p
          role="alert"
          className="clip-notch-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {t(`errors.${errorCode}`)}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <UserPlus data-icon="inline-start" />
        )}
        {t("signupCta")}
      </Button>
    </form>
  );
}
