/**
 * Utility functions for displaying spaced repetition information in the UI
 */

import type { Algorithm, SpacedRepetitionState } from "@avenire/models"
import { calculateMastery, getEloCategory } from "@avenire/models"

/**
 * Get a human-readable description of the FSRS state
 */
export function getFSRSStateLabel(state: number): string {
  switch (state) {
    case 0:
      return "New"
    case 1:
      return "Learning"
    case 2:
      return "Review"
    case 3:
      return "Relearning"
    default:
      return "Unknown"
  }
}

/**
 * Get color for FSRS state
 */
export function getFSRSStateColor(state: number): string {
  switch (state) {
    case 0:
      return "blue"
    case 1:
      return "orange"
    case 2:
      return "green"
    case 3:
      return "red"
    default:
      return "gray"
  }
}

/**
 * Format mastery level as percentage
 */
export function formatMasteryLevel(state: SpacedRepetitionState): string {
  const mastery = calculateMastery(state)
  return `${Math.round(mastery * 100)}%`
}

/**
 * Get priority score for sorting (higher = more urgent)
 */
export function getPriorityScore(state: SpacedRepetitionState): number {
  const now = new Date()
  const daysUntilDue = Math.floor(
    (state.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Overdue items get highest priority
  if (daysUntilDue <= 0) {
    return 100 + Math.abs(daysUntilDue) * 10
  }
  
  // Items due soon get high priority
  if (daysUntilDue <= 1) {
    return 80
  }
  
  // Items due in near future get medium priority
  if (daysUntilDue <= 7) {
    return 50 - daysUntilDue * 2
  }
  
  // Future items get lower priority
  return Math.max(0, 20 - daysUntilDue)
}

/**
 * Get algorithm display name
 */
export function getAlgorithmDisplayName(algorithm: Algorithm): string {
  switch (algorithm) {
    case "FSRS":
      return "FSRS"
    case "SM-2":
      return "SuperMemo 2"
    case "Leitner":
      return "Leitner System"
    default:
      return algorithm
  }
}

/**
 * Get ELO category with styling
 */
export function getEloInfo(rating: number) {
  return getEloCategory(rating)
}

/**
 * Format interval as human-readable string
 */
export function formatInterval(interval: number): string {
  if (interval < 1) {
    return "Today"
  } else if (interval === 1) {
    return "1 day"
  } else if (interval < 7) {
    return `${interval} days`
  } else if (interval < 30) {
    const weeks = Math.floor(interval / 7)
    return `${weeks} week${weeks > 1 ? "s" : ""}`
  } else if (interval < 365) {
    const months = Math.floor(interval / 30)
    return `${months} month${months > 1 ? "s" : ""}`
  } else {
    const years = Math.floor(interval / 365)
    return `${years} year${years > 1 ? "s" : ""}`
  }
}

/**
 * Get stability description for FSRS
 */
export function getStabilityDescription(stability: number): string {
  if (stability < 1) {
    return "Very Unstable"
  } else if (stability < 7) {
    return "Unstable"
  } else if (stability < 30) {
    return "Moderate"
  } else if (stability < 90) {
    return "Stable"
  } else if (stability < 365) {
    return "Very Stable"
  } else {
    return "Mastered"
  }
}

/**
 * Get difficulty description for FSRS
 */
export function getDifficultyDescription(difficulty: number): string {
  // FSRS difficulty is 0-1, where lower = easier
  if (difficulty < 0.3) {
    return "Easy"
  } else if (difficulty < 0.5) {
    return "Moderate"
  } else if (difficulty < 0.7) {
    return "Hard"
  } else {
    return "Very Hard"
  }
}

