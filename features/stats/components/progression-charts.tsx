"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";

import type { ProgressionPoint } from "../types";

const W = 600;
const H = 150;
const PAD = { top: 12, right: 14, bottom: 8, left: 14 };

interface LineChartProps {
  title: string;
  values: number[];
  labels: string[];
  maxValue: number;
  color: string;
  formatValue: (v: number) => string;
}

/**
 * Courbe SVG maison (zéro dépendance) : ligne + aire dégradée + dernier
 * point mis en avant. L'échelle verticale va de 0 au maximum théorique
 * pour que deux graphiques soient comparables d'une visite à l'autre.
 */
function LineChart({
  title,
  values,
  labels,
  maxValue,
  color,
  formatValue,
}: LineChartProps) {
  const gradientId = useId();
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left +
    (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxValue) * innerH;

  const path = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values[values.length - 1];

  return (
    <figure className="panel clip-notch min-w-0 flex-1 p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="overline-label text-muted-foreground">{title}</span>
        <span className="display text-2xl tabular-nums" style={{ color }}>
          {formatValue(last)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`${title} — ${values.map(formatValue).join(", ")}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Lignes de repère 25/50/75 % */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * f}
            y2={PAD.top + innerH * f}
            stroke="currentColor"
            strokeOpacity="0.08"
          />
        ))}
        {values.length > 1 && (
          <polygon
            points={`${PAD.left},${PAD.top + innerH} ${path} ${x(values.length - 1)},${PAD.top + innerH}`}
            fill={`url(#${gradientId})`}
          />
        )}
        <polyline
          points={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === values.length - 1 ? 4.5 : 2.5}
            fill={color}
          >
            <title>{`${labels[i]} — ${formatValue(v)}`}</title>
          </circle>
        ))}
      </svg>
    </figure>
  );
}

interface ProgressionChartsProps {
  progression: ProgressionPoint[];
  maxSessionScore: number;
}

/** Évolution : score et précision des 30 dernières parties terminées. */
export function ProgressionCharts({
  progression,
  maxSessionScore,
}: ProgressionChartsProps) {
  const t = useTranslations("stats.charts");
  const format = useFormatter();

  if (progression.length < 2) {
    return (
      <div className="panel clip-notch p-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const labels = progression.map((p) =>
    format.dateTime(new Date(p.completedAt), {
      day: "numeric",
      month: "short",
    }),
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <LineChart
        title={t("score", { count: progression.length })}
        values={progression.map((p) => p.score)}
        labels={labels}
        maxValue={maxSessionScore}
        color="var(--signal)"
        formatValue={(v) => String(v)}
      />
      <LineChart
        title={t("accuracy", { count: progression.length })}
        values={progression.map((p) => p.accuracyPct)}
        labels={labels}
        maxValue={100}
        color="var(--info)"
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
}
