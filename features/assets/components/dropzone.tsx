"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
}

const IMAGE_ACCEPT = "image/png,image/webp,image/jpeg";

/** Zone de glisser-déposer (ou clic) pour fichiers image. */
export function Dropzone({
  onFiles,
  label,
  hint,
  multiple = true,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || disabled) return;
    const files = [...fileList];
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors",
        isOver
          ? "border-primary bg-primary/10"
          : "hover:border-primary/50 hover:bg-accent/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
      aria-label={label}
    >
      <UploadCloud
        className={cn(
          "size-7",
          isOver ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
