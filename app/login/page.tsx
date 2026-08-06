import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/features/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginMeta") };
}

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

  const t = await getTranslations("auth");

  return (
    <div className="bg-grid mask-fade-edges relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div className="panel clip-notch hard-shadow relative w-full max-w-sm space-y-6 p-6 sm:p-8">
        <div className="space-y-1.5 text-center">
          <span className="clip-slash mx-auto flex h-10 w-11 items-center justify-center bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <h1 className="display pt-2 text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LoginForm callbackUrl={target} />
      </div>
    </div>
  );
}
