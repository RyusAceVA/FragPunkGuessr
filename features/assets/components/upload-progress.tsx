"use client";

import { Check, CircleAlert, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { UploadItem } from "../hooks/use-upload-queue";

interface UploadProgressProps {
  items: UploadItem[];
  total: number;
  doneCount: number;
  errorCount: number;
  isUploading: boolean;
}

/** Progression d'import : compteur global, barre, détail des erreurs. */
export function UploadProgress({
  items,
  total,
  doneCount,
  errorCount,
  isUploading,
}: UploadProgressProps) {
  const t = useTranslations("assetsManager");

  if (total === 0) return null;

  const processed = doneCount + errorCount;
  const percent = Math.round((processed / total) * 100);
  const failures = items.filter((i) => i.status === "error");
  const warnings = items.filter((i) => i.status === "done" && i.warning);

  return (
    <div className="panel clip-notch-sm space-y-2 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {isUploading ? (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          ) : errorCount > 0 ? (
            <CircleAlert className="size-4 text-destructive" aria-hidden />
          ) : (
            <Check className="size-4 text-signal" aria-hidden />
          )}
          {isUploading
            ? t("uploading")
            : errorCount > 0
              ? t("doneWithErrors")
              : t("done")}
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("filesCount", { processed, total })}
          {errorCount > 0 && ` · ${t("errorsCount", { count: errorCount })}`}
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full transition-[width] duration-300",
            errorCount > 0 ? "bg-destructive" : "bg-signal",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {failures.length > 0 && (
        <ul className="max-h-36 space-y-1 overflow-y-auto text-xs">
          {failures.map((item) => (
            <li key={item.id} className="flex gap-1.5 text-destructive">
              <CircleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
              <span>
                <span className="font-mono">{item.fileName}</span> —{" "}
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("warnings", {
            count: warnings.length,
            list: warnings
              .map((w) => `${w.fileName} (${w.warning})`)
              .slice(0, 3)
              .join(", "),
          })}
        </p>
      )}
    </div>
  );
}
