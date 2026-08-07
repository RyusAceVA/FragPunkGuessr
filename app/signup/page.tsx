import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, isGoogleEnabled } from "@/features/auth";
import { GoogleButton } from "@/features/auth/components/google-button";
import { SignupForm } from "@/features/auth/components/signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupMeta") };
}

export default async function SignupPage() {
  // Déjà connecté → direction l'accueil
  const session = await auth();
  if (session?.user) redirect("/");

  const t = await getTranslations("auth");

  return (
    <div className="bg-grid mask-fade-edges relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8">
      <div className="panel clip-notch hard-shadow relative w-full max-w-sm space-y-5 p-6 sm:p-8">
        <div className="space-y-1.5 text-center">
          <span className="clip-slash mx-auto flex h-10 w-11 items-center justify-center bg-signal text-background">
            <UserPlus className="size-5" aria-hidden />
          </span>
          <h1 className="display pt-2 text-3xl">{t("signupTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("signupSubtitle")}</p>
        </div>

        <SignupForm />

        {isGoogleEnabled && (
          <>
            <div className="flex items-center gap-3" aria-hidden>
              <span className="slash-divider flex-1" />
              <span className="overline-label text-muted-foreground">
                {t("or")}
              </span>
              <span className="slash-divider flex-1" />
            </div>
            <GoogleButton callbackUrl="/" />
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
