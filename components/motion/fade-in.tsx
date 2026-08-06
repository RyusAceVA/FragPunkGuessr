"use client";

import { motion, useReducedMotion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  /** Délai en secondes avant le démarrage de l'animation */
  delay?: number;
  /** Décalage vertical initial en pixels */
  y?: number;
  className?: string;
}

/**
 * Apparition en fondu + translation, désactivée si l'utilisateur
 * préfère les animations réduites (accessibilité).
 */
export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
