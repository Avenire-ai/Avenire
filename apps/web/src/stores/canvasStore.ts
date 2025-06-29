import { create } from 'zustand'
import { type Mode } from '../components/chat/canvas/canvas'
import { type Quiz } from '../lib/canvas_types'
import { type Flashcard } from '../lib/canvas_types'

interface CanvasState {
  isOpen: boolean
  mode: Mode
  chatId: string | null
  setOpen: (open: boolean) => void
  setMode: (mode: Mode) => void
  setChatId: (chatId: string | null) => void
  openCanvas: (mode?: Mode) => void
  closeCanvas: () => void
  currentQuestion: Quiz | null
  setCurrentQuestion: (question: Quiz | null) => void
  currentFlashcard: Flashcard | null
  setCurrentFlashcard: (flashcard: Flashcard | null) => void
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
  currentQuestion: null,
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  currentFlashcard: null,
  setCurrentFlashcard: (flashcard) => set({ currentFlashcard: flashcard }),
}))
