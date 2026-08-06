import type { Metadata } from "next";

import { GameScreen } from "@/features/game";

export const metadata: Metadata = {
  title: "Jouer",
};

/** Mode Classique — plein écran sous la navbar, comme un vrai jeu. */
export default function PlayPage() {
  return (
    <div className="h-[calc(100dvh-4rem)]">
      <GameScreen />
    </div>
  );
}
