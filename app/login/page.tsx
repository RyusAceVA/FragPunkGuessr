import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/features/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const target =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/admin";

  // Déjà connecté → inutile de montrer le formulaire
  const session = await auth();
  if (session?.user) redirect(target);

  return (
    <div className="bg-grid mask-fade-edges relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div
        className="absolute top-1/3 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]"
        aria-hidden
      />
      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl sm:p-8">
        <div className="space-y-1.5 text-center">
          <span className="glow-primary mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <h1 className="pt-2 font-heading text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Espace réservé à l&apos;administration.
          </p>
        </div>
        <LoginForm callbackUrl={target} />
      </div>
    </div>
  );
}
