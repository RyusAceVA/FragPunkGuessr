"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountUpProps {
  /** Valeur finale affichée */
  value: number;
  /** Valeur de départ du comptage (défaut : 0) */
  from?: number;
  /** Durée en secondes */
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Compteur animé : monte de `from` à `value` avec une décélération
 * douce. Respecte prefers-reduced-motion (affichage direct).
 */
export function CountUp({
  value,
  from = 0,
  duration = 1,
  delay = 0,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(from);
  const [display, setDisplay] = useState(reduced ? value : from);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, delay, reduced, motionValue]);

  return (
    <span className={className} aria-label={String(value)}>
      {display}
    </span>
  );
}
