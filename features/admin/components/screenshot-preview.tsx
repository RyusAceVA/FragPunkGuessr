"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { assetUrl, isPlaced, type AdminScreenshot } from "../types";

/** Prévisualisation du screenshot sélectionné (panneau droit). */
export function ScreenshotPreview({
  screenshot,
}: {
  screenshot: AdminScreenshot;
}) {
  const t = useTranslations("workshop");
  const url = assetUrl(screenshot.assetPath);

  return (
    <div className="space-y-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="clip-notch-sm group relative block overflow-hidden"
        title={t("openOriginal")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- asset locale servie par l'API */}
        <img
          src={url}
          alt={t("markerAria", { code: screenshot.code })}
          className="aspect-video w-full bg-black/50 object-contain"
          decoding="async"
        />
        <span className="absolute right-2 bottom-2 rounded-sm bg-background/70 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-3.5" aria-hidden />
        </span>
      </a>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          #{screenshot.code}
        </span>
        <Badge variant={isPlaced(screenshot) ? "signal" : "outline"}>
          {isPlaced(screenshot) ? t("badgePlaced") : t("badgeToPlace")}
        </Badge>
      </div>
    </div>
  );
}
