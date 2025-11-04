/**
 * Leitner System Implementation
 * Simple box-based spaced repetition system
 */

import type { SpacedRepetitionState, ReviewResult } from './types'

/**
 * Update Leitner state based on review result
 */
export function updateLeitner(
  state: SpacedRepetitionState,
  result: ReviewResult
): SpacedRepetitionState {
  const { leitnerBox = 1, repetitionCount } = state
  let newBox = leitnerBox
  let newInterval = 1
  let newRepetitionCount = repetitionCount

  // Box intervals: Box 1 = 1 day, Box 2 = 2 days, Box 3 = 4 days, Box 4 = 8 days, Box 5 = 16 days
  const boxIntervals = [0, 1, 2, 4, 8, 16] // Index 0 unused

  if (result.correct && result.confidence >= 3) {
    // Correct answer - move to next box (max 5)
    newBox = Math.min(leitnerBox + 1, 5)
    newInterval = boxIntervals[newBox]
    newRepetitionCount = repetitionCount + 1
  } else {
    // Incorrect - move back to box 1
    newBox = 1
    newInterval = boxIntervals[1]
    newRepetitionCount = 0
  }

  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + newInterval)

  return {
    interval: newInterval,
    easeFactor: state.easeFactor,
    repetitionCount: newRepetitionCount,
    dueDate,
    lastStudied: now,
    leitnerBox: newBox,
    fsrsState: state.fsrsState,
  }
}

/**
 * Initialize Leitner state for new item
 */
export function initializeLeitner(): SpacedRepetitionState {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    interval: 1,
    easeFactor: 2.5,
    repetitionCount: 0,
    dueDate: tomorrow,
    lastStudied: now,
    leitnerBox: 1,
  }
}

