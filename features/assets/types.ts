/**
 * DTO du module Assets.
 * `AssetsMap` reflète le contrat JSON de GET /api/admin/maps (le module
 * consomme la même API HTTP que l'atelier, sans import inter-features).
 *
 * Extensible : d'autres types d'assets (vidéos, sons…) viendront enrichir
 * `UploadKind` (schemas.ts) et leurs pipelines dédiés dans server/uploads.ts.
 */

export interface AssetsFloor {
  id: string;
  name: string;
  level: number;
  width: number;
  height: number;
}

export interface AssetsMap {
  id: string;
  name: string;
  assetDir: string;
  floors: AssetsFloor[];
  screenshotCount: number;
  placedCount: number;
}

export interface AssetsStatus {
  /** Faux sur un hébergement serverless (FS en lecture seule) */
  writable: boolean;
}

/** Réponse du serveur pour UN fichier uploadé. */
export interface UploadResponse {
  ok: boolean;
  /** Libellé résultat ("1F", "0001"…) */
  label?: string;
  /** Avertissement non bloquant (ex. miniature non générée) */
  warning?: string;
  error?: string;
}
