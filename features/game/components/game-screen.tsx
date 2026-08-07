"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

import { useRoundManager } from "../hooks/use-round-manager";
import { useGameStore } from "../store";
import { GuessPanel } from "./guess-panel";
import { ResultLoading, ResultOverlay } from "./result-overlay";
import { RoundTimer } from "./round-timer";
import { ScreenshotView } from "./screenshot-view";
import { StartScreen } from "./start-screen";
import { SummaryScreen } from "./summary-screen";

/**
 * Écran de jeu du mode Classique — la boucle complète :
 * lancer une partie → N manches (screenshot → map → étage → pin →
 * validation → résultat) → récapitulatif → rejouer.
 */
export function GameScreen() {
  const t = useTranslations("play.round");
  const phase = useGameStore((s) => s.phase);
  const session = useGameStore((s) => s.session);
  const currentRound = useGameStore((s) => s.currentRound);
  const result = useGameStore((s) => s.result);
  const panelOpen = useGameStore((s) => s.panelOpen);
  const setPanelOpen = useGameStore((s) => s.setPanelOpen);
  const advance = useGameStore((s) => s.advance);
  const backToIdle = useGameStore((s) => s.backToIdle);
  const markRoundStarted = useGameStore((s) => s.markRoundStarted);

  const {
    startSession,
    validateGuess,
    submitTimeout,
    isStartingSession,
    isValidating,
  } = useRoundManager();
  const roundStartedAt = useGameStore((s) => s.roundStartedAt);

  // L'image de la manche est-elle affichée ? (sinon : écran de chargement)
  const [screenshotReady, setScreenshotReady] = useState(false);
  const handleScreenshotReady = useCallback(
    (ready: boolean) => {
      setScreenshotReady(ready);
      // L'image est visible : le chrono du temps de réponse démarre
      if (ready) markRoundStarted();
    },
    [markRoundStarted],
  );

  if (phase === "idle" || !session) {
    return (
      <StartScreen isStarting={isStartingSession} onStart={startSession} />
    );
  }

  if (phase === "summary") {
    return (
      <SummaryScreen
        sessionId={session.id}
        isRestarting={isStartingSession}
        onNewGame={startSession}
        onQuit={backToIdle}
      />
    );
  }

  if (!currentRound) return null;

  return (
    <div className="relative h-full overflow-hidden">
      <ScreenshotView
        imageUrl={currentRound.imageUrl}
        onReadyChange={handleScreenshotReady}
      />

      {/* Chrome de la manche — aucune info sur la map, seulement la progression */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <span className="clip-slash bg-foreground px-3 py-1.5 font-heading text-xs font-bold tracking-wider text-background uppercase tabular-nums">
          {t("chip", {
            index: currentRound.index,
            total: session.roundCount,
          })}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={backToIdle}
          aria-label={t("quit")}
          className="glass"
        >
          <X />
        </Button>
        {/* Compte à rebours des modes chronométrés — la limite vient
            du DTO de session, jamais du gameplay */}
        {phase === "round" &&
          session.timeLimitMsPerRound !== null &&
          screenshotReady &&
          roundStartedAt !== null && (
            <RoundTimer
              startedAt={roundStartedAt}
              limitMs={session.timeLimitMsPerRound}
              onExpire={submitTimeout}
            />
          )}
      </div>

      {/* Bouton Deviner */}
      <AnimatePresence>
        {phase === "round" && !panelOpen && screenshotReady && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
          >
            <span className="cta-shards inline-flex">
              <Button
                size="xl"
                className="px-12 text-lg"
                onClick={() => setPanelOpen(true)}
              >
                <Crosshair data-icon="inline-start" className="size-5" />
                {t("guess")}
              </Button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panneau de guess (map → étage → pin) */}
      <AnimatePresence>
        {phase === "round" && panelOpen && (
          <GuessPanel isValidating={isValidating} onValidate={validateGuess} />
        )}
      </AnimatePresence>

      {isStartingSession && <ResultLoading />}

      {/* Résultat de la manche */}
      <AnimatePresence>
        {phase === "result" && result && (
          <ResultOverlay
            result={result}
            screenshotUrl={currentRound.imageUrl}
            onNext={advance}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
