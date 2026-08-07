/** Périodes de classement. */
export const LEADERBOARD_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "alltime",
] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

/** Une ligne de classement. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** Meilleur score de partie sur la période */
  bestScore: number;
  /** Parties terminées sur la période */
  gamesPlayed: number;
}

/** Position du joueur courant (même hors du top affiché). */
export interface LeaderboardSelf {
  rank: number;
  bestScore: number;
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  /** null = tous modes confondus */
  mode: string | null;
  entries: LeaderboardEntry[];
  me: LeaderboardSelf | null;
}
