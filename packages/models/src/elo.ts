/**
 * ELO Rating System Implementation
 * 
 * Tracks performance rating for flashcards and quiz questions
 * Default starting ELO: 1500
 * K-factor: determines how much ratings change after each review
 */

import type { EloState } from './types'

const DEFAULT_K_FACTOR = 32
const DEFAULT_ELO = 1500
const MIN_ELO = 0
const MAX_ELO = 3000

/**
 * Calculate expected score (probability of correct answer)
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new ELO rating based on result
 * 
 * @param currentRating - Current ELO rating
 * @param confidence - Confidence level (1-5, converted to expected score)
 * @param correct - Whether the answer was correct
 * @param kFactor - K-factor for rating adjustments (default: 32)
 * @returns New ELO rating
 */
export function updateElo(
  currentRating: number,
  confidence: number,
  correct: boolean,
  kFactor: number = DEFAULT_K_FACTOR
): number {
  // Convert confidence (1-5) to expected score
  // Lower confidence = lower expected score
  // 1 = 0.1, 2 = 0.3, 3 = 0.5, 4 = 0.7, 5 = 0.9
  const expectedScore = 0.1 + (confidence - 1) * 0.2
  
  // Actual score: 1 if correct, 0 if incorrect
  const actualScore = correct ? 1 : 0
  
  // Calculate rating change
  // Rating change = K * (actual_score - expected_score)
  const ratingChange = kFactor * (actualScore - expectedScore)
  
  // Update rating
  let newRating = currentRating + ratingChange
  
  // Clamp rating to reasonable bounds
  newRating = Math.max(MIN_ELO, Math.min(MAX_ELO, newRating))
  
  return Math.round(newRating)
}

/**
 * Calculate ELO with opponent rating (for comparative performance)
 * 
 * @param playerRating - Current player/item rating
 * @param opponentRating - Opponent/average rating
 * @param won - Whether player won (correct answer)
 * @param kFactor - K-factor for rating adjustments
 * @returns New ELO rating
 */
export function updateEloWithOpponent(
  playerRating: number,
  opponentRating: number,
  won: boolean,
  kFactor: number = DEFAULT_K_FACTOR
): number {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating)
  const actualScore = won ? 1 : 0
  
  const ratingChange = kFactor * (actualScore - expectedScore)
  let newRating = playerRating + ratingChange
  
  newRating = Math.max(MIN_ELO, Math.min(MAX_ELO, newRating))
  
  return Math.round(newRating)
}

/**
 * Calculate dynamic K-factor based on rating and performance
 * Higher K for lower ratings (faster adjustments for new items)
 * Lower K for higher ratings (slower adjustments for mastered items)
 */
export function calculateDynamicKFactor(
  currentRating: number,
  defaultK: number = DEFAULT_K_FACTOR
): number {
  if (currentRating < 1200) {
    // New/struggling items - higher K for faster improvement
    return defaultK * 1.5
  } else if (currentRating > 2000) {
    // Mastered items - lower K for stability
    return defaultK * 0.5
  }
  return defaultK
}

/**
 * Initialize ELO state for new item
 */
export function initializeElo(): number {
  return DEFAULT_ELO
}

/**
 * Calculate performance trend from ELO history
 * Returns trend score: -1 (declining) to 1 (improving)
 */
export function calculateEloTrend(
  history: EloState["history"],
  windowSize: number = 10
): number {
  if (history.length < 2) return 0

  const recentHistory = history.slice(-windowSize)
  const firstRating = recentHistory[0].rating
  const lastRating = recentHistory[recentHistory.length - 1].rating
  
  const change = lastRating - firstRating
  const maxChange = 500 // Normalize to -1 to 1 scale
  
  return Math.max(-1, Math.min(1, change / maxChange))
}

/**
 * Get ELO category/level from rating
 */
export function getEloCategory(rating: number): {
  level: string
  color: string
} {
  if (rating < 1000) {
    return { level: "Beginner", color: "gray" }
  } else if (rating < 1400) {
    return { level: "Novice", color: "blue" }
  } else if (rating < 1600) {
    return { level: "Intermediate", color: "green" }
  } else if (rating < 1800) {
    return { level: "Advanced", color: "yellow" }
  } else if (rating < 2000) {
    return { level: "Expert", color: "orange" }
  } else {
    return { level: "Master", color: "red" }
  }
}

