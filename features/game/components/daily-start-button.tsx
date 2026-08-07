"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useStartSession } from "../api";
import { useGameStore } from "../store";

/**
 * Lance la tentative quotidienne : crée la session (mode DAILY, la
 * tentative est consommée côté serveur) puis bascule sur /play — le
 * store de jeu est global, GameScreen reprend directement la manche 1.
 */
export function DailyStartButton() {
  const t = useTranslations("daily");
  const router = useRouter();
  const startSessionMutation = useStartSession();
  const beginSession = useGameStore((s) => s.beginSession);
  const setCreateInput = useGameStore((s) => s.setCreateInput);

  function start() {
    setCreateInput({ mode: "DAILY" });
    startSessionMutation.mutate(
      { mode: "DAILY" },
      {
        onSuccess: (session) => {
          beginSession(session);
          router.push("/play");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <span className="cta-shards inline-flex">
      <Button
        size="xl"
        className="px-10"
        onClick={start}
        disabled={startSessionMutation.isPending}
      >
        {startSessionMutation.isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <CalendarClock data-icon="inline-start" />
        )}
        {t("playCta")}
      </Button>
    </span>
  );
}
