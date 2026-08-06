"use client";

import { KeyRound, Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authenticate } from "../actions";

/** Formulaire de connexion — Server Action + états de chargement. */
export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@exemple.com"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Mot de passe</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="glow-primary w-full"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <LogIn data-icon="inline-start" />
        )}
        Connexion
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <KeyRound className="size-3" aria-hidden />
        Session sécurisée — cookies httpOnly, 12 h
      </p>
    </form>
  );
}
