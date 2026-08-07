"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { signInWithGoogle } from "../actions";

/** Logo Google monochrome (tracé officiel simplifié, licence libre). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.83h5.36c-.5 2.48-2.6 3.9-5.36 3.9a5.91 5.91 0 0 1 0-11.82c1.44 0 2.75.51 3.78 1.5l2.86-2.86A9.79 9.79 0 0 0 12 2.75a9.25 9.25 0 1 0 0 18.5c5.33 0 8.87-3.75 8.87-9.03 0-.6-.07-1.06-.16-1.52Z"
      />
    </svg>
  );
}

/** Bouton « Continuer avec Google » — n'apparaît que si configuré. */
export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");

  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="secondary" size="lg" className="w-full">
        <GoogleMark data-icon="inline-start" />
        {t("googleCta")}
      </Button>
    </form>
  );
}
