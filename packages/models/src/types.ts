/**
 * Common types for spaced repetition models
 */

export type Algorithm = "FSRS" | "SM-2" | "Leitner"

export interface SpacedRepetitionState {
  interval: number // Days until next review
  easeFactor: number // Ease factor (SM-2)
  repetitionCount: number // Number of successful reviews
  dueDate: Date
  lastStudied?: Date
  leitnerBox?: number // For Leitner system (1-5)
  fsrsState?: {
    stability: number // Memory stability in days
    difficulty: number // Memory difficulty (0-1)
    lastReview: Date
    reps: number // Number of successful reviews
    lapses: number // Number of failed reviews
    state: number // 0=new, 1=learning, 2=review, 3=relearning
  }
}

export interface ReviewResult {
  confidence: number // 1-5 rating
  correct: boolean // Whether the answer was correct
  timeSpent: number // Time in seconds
}

export interface EloState {
  rating: number
  history: Array<{
    timestamp: string
    rating: number
    confidence: number
    correct: boolean
  }>
}

