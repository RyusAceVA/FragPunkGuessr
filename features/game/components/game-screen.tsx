"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useRoundManager } from "../hooks/use-round-manager";
import { useGameStore } from "../store";
import { GuessPanel } from "./guess-panel";
import { ResultLoading, ResultOverlay } from "./result-overlay";
import { ScreenshotView } from "./screenshot-view";
import { StartScreen } from "./start-screen";
import { SummaryScreen } from "./summary-screen";

/**
 * Écran de jeu du mode Classique — la boucle complète :
 * lancer une partie → N manches (screenshot → map → étage → pin →
 * validation → résultat) → récapitulatif → rejouer.
 */
export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const session = useGameStore((s) => s.session);
  const currentRound = useGameStore((s) => s.currentRound);
  const result = useGameStore((s) => s.result);
  const panelOpen = useGameStore((s) => s.panelOpen);
  const setPanelOpen = useGameStore((s) => s.setPanelOpen);
  const advance = useGameStore((s) => s.advance);
  const backToIdle = useGameStore((s) => s.backToIdle);

  const { startSession, validateGuess, isStartingSession, isValidating } =
    useRoundManager();

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
      <ScreenshotView imageUrl={currentRound.imageUrl} />

      {/* Chrome de la manche — aucune info sur la map, seulement la progression */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <span className="glass rounded-full px-3 py-1.5 text-xs font-medium tabular-nums">
          Manche {currentRound.index}/{session.roundCount}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={backToIdle}
          aria-label="Abandonner la partie"
          className="glass rounded-full"
        >
          <X />
        </Button>
      </div>

      {/* Bouton Deviner */}
      <AnimatePresence>
        {phase === "round" && !panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
          >
            <Button
              size="lg"
              className="glow-primary px-8"
              onClick={() => setPanelOpen(true)}
            >
              <Crosshair data-icon="inline-start" />
              Deviner
            </Button>
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
