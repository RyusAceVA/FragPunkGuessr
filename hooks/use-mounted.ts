"use client";

import { useEffect, useState } from "react";

/**
 * Vrai une fois le composant monté côté client.
 * Utile pour éviter les mismatchs d'hydratation sur du contenu
 * dépendant du navigateur.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
