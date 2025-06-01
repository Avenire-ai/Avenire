import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { create } from "zustand";

interface WhiteboardState {
  whiteboardAPI: ExcalidrawImperativeAPI | null;
  whiteboardLoading: boolean;
}

interface WhiteboardActions {
  setWhiteboardAPI: (api: ExcalidrawImperativeAPI) => void;
  setWhiteboardLoading: (loading: boolean) => void;
}

export const useWhiteboardStore = create<WhiteboardState & WhiteboardActions>((set) => ({
  whiteboardAPI: null,
  whiteboardLoading: true,
  setWhiteboardAPI: (api) => set({ whiteboardAPI: api }),
  setWhiteboardLoading: (loading) => set({ whiteboardLoading: loading }),
})); 