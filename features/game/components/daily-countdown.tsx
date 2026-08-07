"use client";

import { useEffect, useState } from "react";

/** Prochain minuit UTC — la frontière des défis quotidiens. */
function nextDailyReset(): number {
  const now = new Date();
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
}

/** Compte à rebours jusqu'au prochain défi (HH:MM:SS). */
export function DailyCountdown({ className }: { className?: string }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () =>
      setRemainingMs(Math.max(0, nextDailyReset() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Rendu serveur/hydratation : pas de valeur avant le premier tick client
  if (remainingMs === null) {
    return (
      <span className={className} aria-hidden>
        --:--:--
      </span>
    );
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={className} role="timer">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
