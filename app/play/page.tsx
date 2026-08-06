import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GameScreen } from "@/features/game";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("play");
  return { title: t("meta") };
}

/** Mode Classique — plein écran sous la navbar, comme un vrai jeu. */
export default function PlayPage() {
  return (
    <div className="h-[calc(100dvh-4rem)]">
      <GameScreen />
    </div>
  );
}
