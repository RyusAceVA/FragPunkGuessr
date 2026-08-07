/** Profil de l'utilisateur connecté (DTO de /api/profile). */
export interface ProfileData {
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  createdAt: string;
}
