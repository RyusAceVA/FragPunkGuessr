import { create } from "zustand";

/**
 * État UI global (client uniquement).
 * Les états serveur (maps, stats…) passeront par React Query,
 * jamais par Zustand — ce store est réservé à l'UI pure.
 */
interface UiState {
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isMobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
}));
