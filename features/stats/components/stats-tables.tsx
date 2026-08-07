"use client";

import { useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { FloorStatsEntry, MapStatsEntry } from "../types";

/** Précision colorée : rouge < 40 %, neutre, lime ≥ 70 %. */
function AccuracyCell({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        pct >= 70 ? "text-signal" : pct < 40 ? "text-destructive" : "",
      )}
    >
      {pct}%
    </span>
  );
}

/** « Sur quelle map suis-je mauvais ? » — la pire map ouvre le tableau. */
export function MapStatsTable({ maps }: { maps: MapStatsEntry[] }) {
  const t = useTranslations("stats.maps");

  if (maps.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="panel clip-notch overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("map")}</TableHead>
            <TableHead className="text-right">{t("games")}</TableHead>
            <TableHead className="text-right">{t("rounds")}</TableHead>
            <TableHead className="text-right">{t("avgScore")}</TableHead>
            <TableHead className="text-right">{t("accuracy")}</TableHead>
            <TableHead className="text-right">{t("avgDistance")}</TableHead>
            <TableHead className="text-right">{t("winRate")}</TableHead>
            <TableHead className="text-right">{t("best")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maps.map((entry, i) => (
            <TableRow
              key={entry.mapId}
              className={cn(i === 0 && maps.length > 1 && "bg-destructive/6")}
            >
              {/* Nom de map — jamais traduit */}
              <TableCell className="font-heading font-bold uppercase">
                {entry.mapName}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.gamesPlayed}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.roundsPlayed}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.averageScore}
              </TableCell>
              <TableCell className="text-right">
                <AccuracyCell pct={entry.accuracyPct} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.averageDistance !== null
                  ? `${entry.averageDistance} px`
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.winRatePct}%
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {entry.bestScore}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** « Est-ce que je me trompe d'étage ? » — % de mauvais étage en avant. */
export function FloorStatsTable({ floors }: { floors: FloorStatsEntry[] }) {
  const t = useTranslations("stats.floors");

  if (floors.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="panel clip-notch overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("floor")}</TableHead>
            <TableHead className="text-right">{t("rounds")}</TableHead>
            <TableHead className="text-right">{t("avgScore")}</TableHead>
            <TableHead className="text-right">{t("accuracy")}</TableHead>
            <TableHead className="text-right">{t("winRate")}</TableHead>
            <TableHead className="text-right">{t("wrongFloor")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {floors.map((entry) => (
            <TableRow key={entry.floorId}>
              {/* Noms map/étage — jamais traduits */}
              <TableCell className="font-heading font-bold uppercase">
                {entry.mapName}
                <span className="ml-1.5 text-muted-foreground">
                  · {entry.floorName}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.roundsPlayed}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.averageScore}
              </TableCell>
              <TableCell className="text-right">
                <AccuracyCell pct={entry.accuracyPct} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.winRatePct}%
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums",
                  entry.wrongFloorPct >= 25 && "text-destructive",
                )}
              >
                {entry.wrongFloorPct}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
