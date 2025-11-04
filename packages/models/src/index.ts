/**
 * @avenire/models
 * 
 * Spaced repetition and rating models package
 * Provides implementations of FSRS, SM-2, Leitner, and ELO systems
 */

export * from './types'
export * from './fsrs'
export * from './sm2'
export * from './leitner'
export * from './elo'

import type { Algorithm, SpacedRepetitionState, ReviewResult } from './types'
import { updateFSRS, initializeFSRS } from './fsrs'
import { updateSM2, initializeSM2 } from './sm2'
import { updateLeitner, initializeLeitner } from './leitner'
import { calculateDynamicKFactor, initializeElo } from './elo'

/**
 * Main update function - routes to appropriate algorithm
 */
export function updateSpacedRepetition(
  state: SpacedRepetitionState,
  result: ReviewResult,
  algorithm: Algorithm = "FSRS"
): SpacedRepetitionState {
  switch (algorithm) {
    case "SM-2":
      return updateSM2(state, result)
    case "Leitner":
      return updateLeitner(state, result)
    case "FSRS":
    default:
      return updateFSRS(state, result)
  }
}

/**
 * Initialize state for new item
 */
export function initializeState(algorithm: Algorithm = "FSRS"): SpacedRepetitionState {
  switch (algorithm) {
    case "SM-2":
      return initializeSM2()
    case "Leitner":
      return initializeLeitner()
    case "FSRS":
    default:
      return initializeFSRS()
  }
}

/**
 * Calculate mastery level from progress state
 * Returns value between 0-1
 */
export function calculateMastery(state: SpacedRepetitionState): number {
  const { repetitionCount, easeFactor, fsrsState } = state

  if (fsrsState) {
    // FSRS mastery based on stability and difficulty
    const stabilityScore = Math.min(fsrsState.stability / 365, 1) // Normalize to 1 year
    const difficultyPenalty = 1 - fsrsState.difficulty
    return (stabilityScore * 0.7 + difficultyPenalty * 0.3)
  }

  // SM-2/Leitner mastery based on repetition count and ease factor
  const repScore = Math.min(repetitionCount / 10, 1)
  const easeScore = Math.min((easeFactor - 1.3) / (2.5 - 1.3), 1)
  return (repScore * 0.6 + easeScore * 0.4)
}

/**
 * Calculate due date from state
 */
export function calculateDueDate(state: SpacedRepetitionState): Date {
  return state.dueDate
}

/**
 * Get next review item based on due date
 */
export function getNextReview<T extends { dueDate: Date }>(
  items: Array<T>
): T | null {
  const now = new Date()
  const dueItems = items.filter((item) => item.dueDate <= now)
  
  if (dueItems.length === 0) {
    // Find nearest due date
    const sorted = [...items].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    )
    return sorted[0] || null
  }

  // Return earliest due item
  return dueItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]
}

// Re-export ELO functions
export { 
  updateElo,
  updateElo as calculateEloRating,
  calculateDynamicKFactor,
  initializeElo,
  initializeElo as getInitialEloRating,
  updateEloWithOpponent,
  calculateEloTrend,
  getEloCategory
} from './elo'

