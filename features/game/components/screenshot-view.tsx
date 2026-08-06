"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Étape 3 : le screenshot à deviner, plein cadre.
 * Aucune information révélatrice (zone, étage, fichier) — l'image est
 * servie par UUID et l'alt reste générique.
 */
export function ScreenshotView({ imageUrl }: { imageUrl: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      {!loaded && <Skeleton className="absolute inset-6 rounded-xl" />}
      <motion.img
        key={imageUrl}
        src={imageUrl}
        alt="Screenshot à deviner"
        draggable={false}
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.985 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl select-none"
      />
    </div>
  );
}
