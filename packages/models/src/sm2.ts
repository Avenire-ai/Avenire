/**
 * SM-2 (SuperMemo 2) Algorithm Implementation
 * Uses the supermemo library for accurate SM-2 calculations
 */

import { supermemo, type SuperMemoItem, type SuperMemoGrade } from 'supermemo'
import type { SpacedRepetitionState, ReviewResult } from './types'

/**
 * Convert our ReviewResult to SuperMemo grade
 */
function reviewResultToGrade(result: ReviewResult): SuperMemoGrade {
  if (!result.correct) {
    return 0 // Fail
  }
  
  // Convert confidence (1-5) to SuperMemo grade
  // 1 = 1, 2 = 2, 3 = 3, 4 = 4, 5 = 5
  // SuperMemo uses 0-5 scale, where 0=fail, 1=hard, 2=normal, 3=good, 4=easy, 5=perfect
  if (result.confidence <= 2) {
    return 1 // Hard
  } else if (result.confidence === 3) {
    return 3 // Good
  } else if (result.confidence === 4) {
    return 4 // Easy
  } else {
    return 5 // Perfect
  }
}

/**
 * Convert our SpacedRepetitionState to SuperMemoItem
 */
function stateToSuperMemo(state: SpacedRepetitionState): SuperMemoItem {
  return {
    interval: state.interval,
    repetition: state.repetitionCount,
    efactor: state.easeFactor,
  }
}

/**
 * Convert SuperMemoItem to our SpacedRepetitionState
 */
function superMemoToState(
  item: SuperMemoItem,
  now: Date,
  originalState?: SpacedRepetitionState
): SpacedRepetitionState {
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + item.interval)

  return {
    interval: item.interval,
    easeFactor: item.efactor,
    repetitionCount: item.repetition,
    dueDate,
    lastStudied: now,
    leitnerBox: originalState?.leitnerBox,
    fsrsState: originalState?.fsrsState,
  }
}

/**
 * Update SM-2 state based on review result
 */
export function updateSM2(
  state: SpacedRepetitionState,
  result: ReviewResult
): SpacedRepetitionState {
  const now = new Date()
  const item = stateToSuperMemo(state)
  const grade = reviewResultToGrade(result)
  
  // Update using supermemo algorithm
  const updatedItem = supermemo(item, grade)
  
  // Convert back to our state format
  return superMemoToState(updatedItem, now, state)
}

/**
 * Initialize SM-2 state for new item
 */
export function initializeSM2(): SpacedRepetitionState {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    interval: 1,
    easeFactor: 2.5,
    repetitionCount: 0,
    dueDate: tomorrow,
    lastStudied: now,
  }
}

