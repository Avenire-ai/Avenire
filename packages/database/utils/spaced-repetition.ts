/**
 * Spaced Repetition Algorithm Implementations
 * 
 * Supports FSRS (Free Spaced Repetition Scheduler), SM-2, and Leitner systems
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

/**
 * SM-2 Algorithm (SuperMemo 2)
 * Classic spaced repetition algorithm
 */
export function updateSM2(
  state: SpacedRepetitionState,
  result: ReviewResult
): SpacedRepetitionState {
  const { interval, easeFactor, repetitionCount } = state
  let newInterval = interval
  let newEaseFactor = easeFactor
  let newRepetitionCount = repetitionCount

  // Convert confidence (1-5) to SM-2 quality (0-5)
  // 1-2 = incorrect (0-1 quality), 3 = hard (2 quality), 4 = good (4 quality), 5 = easy (5 quality)
  const quality = result.correct
    ? result.confidence === 3
      ? 2
      : result.confidence === 4
      ? 4
      : result.confidence === 5
      ? 5
      : 3
    : 0

  // Update ease factor
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEaseFactor < 1.3) newEaseFactor = 1.3

  // Update interval and repetition count
  if (quality < 3) {
    // Incorrect or hard - reset
    newInterval = 1
    newRepetitionCount = 0
  } else {
    // Correct - increase interval
    if (repetitionCount === 0) {
      newInterval = 1
    } else if (repetitionCount === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
    newRepetitionCount = repetitionCount + 1
  }

  // Calculate due date
  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + newInterval)

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitionCount: newRepetitionCount,
    dueDate,
    lastStudied: now,
    leitnerBox: state.leitnerBox,
    fsrsState: state.fsrsState,
  }
}

/**
 * Leitner System
 * Simple box-based system where cards move between boxes
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
 * FSRS Algorithm (Simplified Free Spaced Repetition Scheduler)
 * Modern algorithm with better retention prediction
 */
export function updateFSRS(
  state: SpacedRepetitionState,
  result: ReviewResult
): SpacedRepetitionState {
  const fsrsState = state.fsrsState || {
    stability: 0.4, // Initial stability for new cards (in days)
    difficulty: 0.3, // Initial difficulty (0-1 scale)
    lastReview: state.lastStudied || new Date(),
    reps: 0,
    lapses: 0,
    state: 0, // 0 = new
  }

  const now = new Date()
  const lastReview = fsrsState.lastReview
  const daysSinceReview = Math.max(
    0,
    Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Convert confidence to recall (0-1)
  // 1 = 0.1, 2 = 0.3, 3 = 0.5, 4 = 0.7, 5 = 0.9
  const recall = result.correct
    ? 0.1 + (result.confidence - 1) * 0.2
    : 0.0

  let newStability = fsrsState.stability
  let newDifficulty = fsrsState.difficulty
  let newState = fsrsState.state
  let newReps = fsrsState.reps
  let newLapses = fsrsState.lapses

  // Update difficulty based on recall
  if (recall >= 0.5) {
    // Good recall - decrease difficulty slightly
    newDifficulty =
      fsrsState.difficulty - 0.15 * (recall - 0.5) * (1 - fsrsState.difficulty)
  } else {
    // Poor recall - increase difficulty
    newDifficulty =
      fsrsState.difficulty +
      0.15 * (0.5 - recall) * fsrsState.difficulty
  }
  newDifficulty = Math.max(0.1, Math.min(1.0, newDifficulty))

  // Update stability based on recall and difficulty
  if (recall >= 0.5) {
    // Successful recall
    const factor = 1 + Math.exp(-8 + 12 * newDifficulty - 3 * recall)
    newStability = fsrsState.stability * factor * (1 + Math.exp(-6))
    
    // State transitions
    if (fsrsState.state === 0) {
      // New -> Learning
      newState = 1
      newStability = 0.4
    } else if (fsrsState.state === 1) {
      // Learning -> Review
      newState = 2
    } else if (fsrsState.state === 3) {
      // Relearning -> Review
      newState = 2
    }
    
    newReps = fsrsState.reps + 1
  } else {
    // Failed recall
    newLapses = fsrsState.lapses + 1
    
    if (fsrsState.state === 0 || fsrsState.state === 1) {
      // New/Learning -> Relearning
      newState = 3
      newStability = 0.2
    } else {
      // Review -> Relearning
      newState = 3
      newStability = fsrsState.stability * 0.15
    }
  }

  // Ensure minimum stability
  newStability = Math.max(0.1, newStability)

  // Calculate new interval (in days)
  const newInterval = Math.max(1, Math.round(newStability))

  // Calculate due date
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + newInterval)

  return {
    interval: newInterval,
    easeFactor: state.easeFactor, // Keep for compatibility
    repetitionCount: newReps,
    dueDate,
    lastStudied: now,
    leitnerBox: state.leitnerBox,
    fsrsState: {
      stability: newStability,
      difficulty: newDifficulty,
      lastReview: now,
      reps: newReps,
      lapses: newLapses,
      state: newState,
    },
  }
}

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
 * Calculate due date from state
 */
export function calculateDueDate(state: SpacedRepetitionState): Date {
  return state.dueDate
}

/**
 * Get next review item based on due date
 */
export function getNextReview(
  items: Array<{ dueDate: Date; [key: string]: any }>
): { dueDate: Date; [key: string]: any } | null {
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
 * Initialize state for new item
 */
export function initializeState(algorithm: Algorithm = "FSRS"): SpacedRepetitionState {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (algorithm === "FSRS") {
    return {
      interval: 1,
      easeFactor: 2.5,
      repetitionCount: 0,
      dueDate: tomorrow,
      lastStudied: now,
      fsrsState: {
        stability: 0.4,
        difficulty: 0.3,
        lastReview: now,
        reps: 0,
        lapses: 0,
        state: 0, // new
      },
    }
  }

  if (algorithm === "Leitner") {
    return {
      interval: 1,
      easeFactor: 2.5,
      repetitionCount: 0,
      dueDate: tomorrow,
      lastStudied: now,
      leitnerBox: 1,
    }
  }

  // SM-2 default
  return {
    interval: 1,
    easeFactor: 2.5,
    repetitionCount: 0,
    dueDate: tomorrow,
    lastStudied: now,
  }
}







