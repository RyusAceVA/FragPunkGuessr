import type { Difficulty, UserRole } from "@/types";

/**
 * DTO du domaine admin, partagés entre les services serveur
 * (sérialisation Prisma) et le client (React Query).
 */

export interface AdminFloor {
  id: string;
  mapId: string;
  name: string;
  level: number;
  assetPath: string;
  /** Dimensions du plan en pixels — référentiel des pixelX/pixelY */
  width: number;
  height: number;
}

export interface AdminZone {
  id: string;
  mapId: string;
  name: string;
  screenshotCount: number;
}

export interface AdminTag {
  id: string;
  name: string;
  screenshotCount: number;
}

export interface AdminMap {
  id: string;
  slug: string;
  name: string;
  assetDir: string;
  floors: AdminFloor[];
  zones: AdminZone[];
  screenshotCount: number;
  placedCount: number;
}

export interface AdminScreenshot {
  /** UUID immuable — la référence stable, indépendante du fichier */
  id: string;
  mapId: string;
  floorId: string | null;
  code: string;
  assetPath: string;
  /** Coordonnées en pixels sur l'image d'origine du plan (null = non placé) */
  pixelX: number | null;
  pixelY: number | null;
  /** null = non renseignée */
  difficulty: Difficulty | null;
  /** Direction de la prise de vue en degrés (0-359, null = non renseignée) */
  orientation: number | null;
  zoneId: string | null;
  zoneName: string | null;
  notes: string | null;
  tags: string[];
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** L'utilisateur de la ligne est celui actuellement connecté */
  isSelf: boolean;
}

export interface SyncSummary {
  maps: number;
  floors: number;
  screenshotsCreated: number;
  screenshotsTotal: number;
  deactivated: number;
  warnings: string[];
}

export { assetUrl } from "@/lib/assets";

export function isPlaced(
  s: AdminScreenshot,
): s is AdminScreenshot & { floorId: string; pixelX: number; pixelY: number } {
  return s.floorId !== null && s.pixelX !== null && s.pixelY !== null;
}
