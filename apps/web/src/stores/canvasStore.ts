import { create } from 'zustand'
import { type Mode } from '../components/chat/canvas/canvas'

interface CanvasState {
  isOpen: boolean
  mode: Mode
  chatId: string | null
  setOpen: (open: boolean) => void
  setMode: (mode: Mode) => void
  setChatId: (chatId: string | null) => void
  openCanvas: (mode?: Mode) => void
  closeCanvas: () => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  isOpen: false,
  mode: 'flashcards',
  chatId: null,
  setOpen: (open) => set({ isOpen: open }),
  setMode: (mode) => set({ mode }),
  setChatId: (chatId) => set({ chatId }),
  openCanvas: (mode) => set({ isOpen: true, mode: mode || 'flashcards' }),
  closeCanvas: () => set({ isOpen: false, chatId: null }),
}))
