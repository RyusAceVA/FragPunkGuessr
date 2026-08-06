"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { assetUrl, isPlaced, type AdminScreenshot } from "../types";

/** Prévisualisation du screenshot sélectionné (panneau droit). */
export function ScreenshotPreview({
  screenshot,
}: {
  screenshot: AdminScreenshot;
}) {
  const url = assetUrl(screenshot.assetPath);

  return (
    <div className="space-y-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group relative block overflow-hidden rounded-lg"
        title="Ouvrir l'original dans un nouvel onglet"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- asset locale servie par l'API */}
        <img
          src={url}
          alt={`Screenshot ${screenshot.code}`}
          className="aspect-video w-full bg-black/50 object-contain"
          decoding="async"
        />
        <span className="absolute right-2 bottom-2 rounded-md bg-background/70 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-3.5" aria-hidden />
        </span>
      </a>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          #{screenshot.code}
        </span>
        <Badge variant={isPlaced(screenshot) ? "secondary" : "outline"}>
          {isPlaced(screenshot) ? "Placé" : "À placer"}
        </Badge>
      </div>
    </div>
  );
}
