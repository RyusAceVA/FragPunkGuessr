import { cn } from "@/lib/utils";

interface MapPinProps {
  /** Couleur de remplissage (hex/oklch) */
  color: string;
  /** Largeur en px (hauteur = ×36/28) */
  size?: number;
  /** Halo lumineux de la couleur du pin */
  glow?: boolean;
  className?: string;
}

/**
 * Pin de carte dont la POINTE est le point (28×36, pointe en bas-centre).
 * Présentationnel pur — le positionnement/l'ancrage sont gérés par l'appelant.
 */
export function MapPin({
  color,
  size = 28,
  glow = false,
  className,
}: MapPinProps) {
  return (
    <svg
      width={size}
      height={(size * 36) / 28}
      viewBox="0 0 28 36"
      className={cn("block", className)}
      style={{
        filter: glow
          ? `drop-shadow(0 0 6px ${color})`
          : "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
      }}
      aria-hidden
    >
      <path
        d="M14 35 C 14 35 3.5 20.5 3.5 13 A 10.5 10.5 0 1 1 24.5 13 C 24.5 20.5 14 35 14 35 Z"
        fill={color}
        stroke="rgba(0, 0, 0, 0.55)"
        strokeWidth="1"
      />
      <circle cx="14" cy="13" r="4" fill="rgba(12, 10, 20, 0.85)" />
    </svg>
  );
}
