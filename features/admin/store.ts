import { create } from "zustand";

export type ScreenshotFilter = "all" | "unplaced" | "placed";

/**
 * État UI du workbench admin (sélections, filtres, options d'affichage).
 * Les données elles-mêmes vivent dans React Query — jamais ici.
 */
interface AdminWorkbenchState {
  selectedMapId: string | null;
  selectedFloorId: string | null;
  selectedScreenshotId: string | null;
  showAllMarkers: boolean;
  /** Miniatures des screenshots directement sur le plan (si assez zoomé) */
  thumbnailMode: boolean;
  filter: ScreenshotFilter;
  search: string;

  selectMap: (mapId: string, defaultFloorId: string | null) => void;
  selectFloor: (floorId: string) => void;
  selectScreenshot: (screenshotId: string | null) => void;
  setShowAllMarkers: (value: boolean) => void;
  setThumbnailMode: (value: boolean) => void;
  setFilter: (filter: ScreenshotFilter) => void;
  setSearch: (search: string) => void;
}

export const useAdminStore = create<AdminWorkbenchState>()((set) => ({
  selectedMapId: null,
  selectedFloorId: null,
  selectedScreenshotId: null,
  showAllMarkers: true,
  thumbnailMode: false,
  filter: "all",
  search: "",

  selectMap: (mapId, defaultFloorId) =>
    set({
      selectedMapId: mapId,
      selectedFloorId: defaultFloorId,
      selectedScreenshotId: null,
      search: "",
      filter: "all",
    }),
  selectFloor: (floorId) => set({ selectedFloorId: floorId }),
  selectScreenshot: (screenshotId) =>
    set({ selectedScreenshotId: screenshotId }),
  setShowAllMarkers: (value) => set({ showAllMarkers: value }),
  setThumbnailMode: (value) => set({ thumbnailMode: value }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
}));
