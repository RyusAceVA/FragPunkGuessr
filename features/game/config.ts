/**
 * Configuration du gameplay — SOURCE UNIQUE.
 * Importable côté serveur (création de session) ET côté client (affichage) ;
 * le nombre de manches d'une session en cours vient toujours du DTO serveur.
 */
export const GAME_CONFIG = {
  /** Nombre de manches d'une partie classique */
  roundsPerSession: 5,
} as const;
