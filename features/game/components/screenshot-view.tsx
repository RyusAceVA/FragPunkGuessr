"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Étape 3 : le screenshot à deviner, plein cadre.
 * Aucune information révélatrice (zone, étage, fichier) — l'image est
 * servie par UUID et l'alt reste générique.
 *
 * L'image est téléchargée en flux pour afficher un écran de chargement
 * avec progression réelle (façon écran de chargement du jeu).
 */
export function ScreenshotView({
  imageUrl,
  onReadyChange,
}: {
  imageUrl: string;
  /** Prévient le parent : écran de chargement visible ou non */
  onReadyChange?: (ready: boolean) => void;
}) {
  const t = useTranslations("play.round");
  const [src, setSrc] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    onReadyChange?.(src !== null);
  }, [src, onReadyChange]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setSrc(null);
    setPercent(0);

    (async () => {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok || !res.body) throw new Error("fetch failed");
        const total = Number(res.headers.get("Content-Length")) || 0;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (!cancelled && total > 0) {
            setPercent(Math.min(99, Math.round((received / total) * 100)));
          }
        }
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob(chunks));
        setPercent(100);
        setSrc(objectUrl);
      } catch {
        // Repli : chargement direct par le navigateur, sans progression
        if (!cancelled) setSrc(imageUrl);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      {/* Écran de chargement : logo pulsant + progression réelle */}
      <AnimatePresence>
        {!src && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="corner-bands absolute inset-0 z-10 overflow-hidden bg-background"
          >
            <div className="vignette-grape absolute inset-0" aria-hidden />
            <div className="relative flex h-full flex-col items-center justify-center gap-4">
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="clip-slash flex size-16 items-center justify-center bg-primary text-primary-foreground shadow-[0_0_44px_-4px_var(--primary)]"
              >
                <Crosshair className="size-9" aria-hidden />
              </motion.span>
              <p className="display text-sm tracking-widest">
                {t.rich("loading", {
                  percent,
                  signal: (chunk) => (
                    <span className="text-signal">{chunk}</span>
                  ),
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {src && (
        <motion.img
          key={src}
          src={src}
          alt={t("screenshotAlt")}
          draggable={false}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl select-none"
        />
      )}
    </div>
  );
}
