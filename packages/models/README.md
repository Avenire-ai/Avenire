# @avenire/models

Spaced repetition and rating models package for Avenire.

This package provides implementations of various spaced repetition algorithms and rating systems:

## Algorithms

### FSRS (Free Spaced Repetition Scheduler)
- Uses the `ts-fsrs` library for accurate FSRS calculations
- Modern algorithm with better retention prediction
- Tracks stability, difficulty, and learning state

### SM-2 (SuperMemo 2)
- Uses the `supermemo` library for accurate SM-2 calculations
- Classic spaced repetition algorithm
- Tracks interval, ease factor, and repetition count

### Leitner System
- Simple box-based spaced repetition system
- Cards move between 5 boxes with increasing intervals
- Good for beginners or simple implementations

### ELO Rating System
- Tracks performance rating for flashcards and quiz questions
- Default starting ELO: 1500
- Dynamic K-factor based on rating level

## Usage

```typescript
import { 
  updateSpacedRepetition, 
  initializeState, 
  calculateMastery,
  updateElo
} from "@avenire/models"

// Initialize a new item
const state = initializeState("FSRS")

// Update after a review
const result = {
  confidence: 4, // 1-5
  correct: true,
  timeSpent: 30 // seconds
}

const updatedState = updateSpacedRepetition(state, result, "FSRS")

// Calculate mastery level (0-1)
const mastery = calculateMastery(updatedState)

// Update ELO rating
const newElo = updateElo(1500, result.confidence, result.correct)
```

## API

See `src/index.ts` for the full API documentation.

