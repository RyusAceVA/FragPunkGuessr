"use client";

import { TimerIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface RoundTimerProps {
  /** Début de la manche (image affichée), epoch ms */
  startedAt: number;
  /** Limite annoncée par le DTO de session — jamais codée en dur ici */
  limitMs: number;
  /** Appelé UNE fois quand le temps expire */
  onExpire: () => void;
}

/**
 * Compte à rebours d'une manche chronométrée. La durée vient du mode
 * (via le DTO de session) : ce composant l'affiche et signale
 * l'expiration, rien d'autre.
 */
export function RoundTimer({ startedAt, limitMs, onExpire }: RoundTimerProps) {
  const [remainingMs, setRemainingMs] = useState(limitMs);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const left = startedAt + limitMs - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startedAt, limitMs]);

  const seconds = Math.ceil(remainingMs / 1000);
  const critical = remainingMs <= 10_000;

  return (
    <span
      className={cn(
        "clip-slash flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm font-bold tabular-nums",
        critical
          ? "text-destructive-foreground animate-pulse bg-destructive"
          : "bg-foreground text-background",
      )}
      role="timer"
      aria-live={critical ? "assertive" : "off"}
    >
      <TimerIcon className="size-3.5" aria-hidden />
      0:{String(Math.max(0, seconds)).padStart(2, "0")}
    </span>
  );
}
