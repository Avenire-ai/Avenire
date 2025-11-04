/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Uses the ts-fsrs library for accurate FSRS calculations
 */

import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs'
import type { Card as FSRSCard } from 'ts-fsrs'
import type { SpacedRepetitionState, ReviewResult } from './types'

/**
 * Convert our ReviewResult to FSRS Rating
 */
function reviewResultToRating(result: ReviewResult): Rating {
  if (!result.correct) {
    return Rating.Again
  }
  
  // Convert confidence (1-5) to FSRS rating
  // 1-2 = Hard, 3 = Good, 4 = Easy
  if (result.confidence <= 2) {
    return Rating.Hard
  } else if (result.confidence === 3) {
    return Rating.Good
  } else if (result.confidence === 4) {
    return Rating.Easy
  } else {
    // Confidence 5 = Easy
    return Rating.Easy
  }
}

/**
 * Convert FSRS Card to our SpacedRepetitionState
 */
function fsrsCardToState(
  card: FSRSCard,
  now: Date,
  originalState?: SpacedRepetitionState
): SpacedRepetitionState {
  const dueDate = new Date(card.due)
  
  // Calculate interval in days
  const interval = Math.max(
    1,
    Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  return {
    interval,
    easeFactor: originalState?.easeFactor || 2.5,
    repetitionCount: card.reps || 0,
    dueDate,
    lastStudied: now,
    leitnerBox: originalState?.leitnerBox,
    fsrsState: {
      stability: card.stability,
      difficulty: card.difficulty,
      lastReview: now,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
    },
  }
}

/**
 * Convert our SpacedRepetitionState to FSRS Card
 */
function stateToFSRSCard(
  state: SpacedRepetitionState,
  now: Date
): FSRSCard {
  if (state.fsrsState) {
    // Use existing FSRS state
    const lastReview = state.fsrsState.lastReview instanceof Date 
      ? state.fsrsState.lastReview 
      : new Date(state.fsrsState.lastReview)
    
    const elapsedDays = Math.floor(
      (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const scheduledDays = Math.floor(
      (state.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return {
      due: state.dueDate,
      stability: state.fsrsState.stability,
      difficulty: state.fsrsState.difficulty,
      elapsed_days: Math.max(0, elapsedDays),
      scheduled_days: scheduledDays,
      reps: state.fsrsState.reps,
      lapses: state.fsrsState.lapses,
      learning_steps: 0, // Required by ts-fsrs Card type
      state: state.fsrsState.state,
      last_review: lastReview,
    }
  }

  // Create new card if no FSRS state exists
  return createEmptyCard(now)
}

/**
 * Update FSRS state based on review result
 */
export function updateFSRS(
  state: SpacedRepetitionState,
  result: ReviewResult
): SpacedRepetitionState {
  const now = new Date()
  
  // Initialize FSRS scheduler with default parameters
  const params = generatorParameters({
    enable_fuzz: true, // Add randomization to intervals
    enable_short_term: false,
  })
  const scheduler = fsrs(params)

  // Convert state to FSRS card
  const card = stateToFSRSCard(state, now)
  
  // Get rating from review result
  const rating = reviewResultToRating(result)
  
  // Calculate new scheduling
  const schedulingCards = scheduler.repeat(card, now)
  
  // Get the card for the rating we received
  let newCard: FSRSCard
  switch (rating) {
    case Rating.Again:
      newCard = schedulingCards[Rating.Again].card
      break
    case Rating.Hard:
      newCard = schedulingCards[Rating.Hard].card
      break
    case Rating.Good:
      newCard = schedulingCards[Rating.Good].card
      break
    case Rating.Easy:
      newCard = schedulingCards[Rating.Easy].card
      break
    default:
      newCard = schedulingCards[Rating.Good].card
  }

  // Convert back to our state format
  return fsrsCardToState(newCard, now, state)
}

/**
 * Initialize FSRS state for new item
 */
export function initializeFSRS(): SpacedRepetitionState {
  const now = new Date()
  const card = createEmptyCard(now)
  
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    interval: 1,
    easeFactor: 2.5,
    repetitionCount: 0,
    dueDate: tomorrow,
    lastStudied: now,
    fsrsState: {
      stability: card.stability,
      difficulty: card.difficulty,
      lastReview: now,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
    },
  }
}

