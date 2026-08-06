import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Accès refusé",
};

/** 403 — connecté, mais sans les droits d'administration. */
export default function ForbiddenPage() {
  return (
    <div className="bg-grid mask-fade-edges relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div
        className="absolute top-1/3 left-1/2 size-80 -translate-x-1/2 rounded-full bg-destructive/10 blur-[100px]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden />
        </span>
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-widest text-muted-foreground">
            ERREUR 403
          </p>
          <h1 className="font-heading text-3xl font-bold">
            Zone réservée au staff
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Ton compte n&apos;a pas les droits d&apos;administration. Si tu
            penses que c&apos;est une erreur, contacte l&apos;administrateur du
            site.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button nativeButton={false} render={<Link href="/" />}>
            Retour à l&apos;accueil
          </Button>
          <form action={logout}>
            <Button variant="outline" type="submit" className="w-full">
              Changer de compte
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
