import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forbidden");
  return { title: t("meta") };
}

/** 403 — connecté, mais sans les droits d'administration. */
export default async function ForbiddenPage() {
  const t = await getTranslations("auth.forbidden");

  return (
    <div className="bg-grid mask-fade-edges relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div className="relative w-full max-w-md space-y-6 text-center">
        <span className="clip-slash text-destructive-foreground hard-shadow mx-auto flex h-13 w-15 items-center justify-center bg-destructive">
          <ShieldAlert className="size-7" aria-hidden />
        </span>
        <div className="space-y-2">
          <p className="overline-label text-destructive">{t("code")}</p>
          <h1 className="display text-4xl">{t("title")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button nativeButton={false} render={<Link href="/" />}>
            {t("backHome")}
          </Button>
          <form action={logout}>
            <Button variant="outline" type="submit" className="w-full">
              {t("switchAccount")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
