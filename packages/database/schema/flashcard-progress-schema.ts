import { pgTable, text, timestamp, jsonb, integer, real, doublePrecision } from "drizzle-orm/pg-core"
import { flashcards } from "./flashcard-schema"
import { user } from "./auth-schema"

export const flashcardProgress = pgTable("flashcard_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  flashcardId: text("flashcard_id").notNull().references(() => flashcards.id),
  cardIndex: integer("card_index").notNull(), // Index within the flashcard.content.cards array
  
  // Spaced repetition data
  interval: integer("interval").notNull().default(1), // Days until next review
  easeFactor: real("ease_factor").notNull().default(2.5), // Ease factor for SM-2
  repetitionCount: integer("repetition_count").notNull().default(0), // Number of successful reviews
  algorithm: text("algorithm").notNull().default("FSRS"), // "FSRS" | "SM-2" | "Leitner"
  
  // Dates
  dueDate: timestamp("due_date").notNull().defaultNow(),
  lastStudied: timestamp("last_studied"),
  
  // Statistics
  studySessions: integer("study_sessions").notNull().default(0),
  masteryLevel: real("mastery_level").notNull().default(0), // 0-1 scale
  eloRating: doublePrecision("elo_rating").notNull().default(1500),
  
  // Performance tracking
  confidence: integer("confidence"), // Last confidence rating (1-5)
  performanceTrends: jsonb("performance_trends").$type<{
    history: Array<{
      timestamp: string;
      confidence: number;
      correct: boolean;
      timeSpent: number; // seconds
      easeFactor?: number;
      interval?: number;
    }>;
  }>().default({ history: [] }),
  
  // Leitner system specific
  leitnerBox: integer("leitner_box").default(1), // Box number (1-5)
  
  // FSRS specific parameters
  fsrsState: jsonb("fsrs_state").$type<{
    stability: number;
    difficulty: number;
    lastReview: string;
    reps: number;
    lapses: number;
    state: number; // 0=new, 1=learning, 2=review, 3=relearning
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type FlashcardProgress = typeof flashcardProgress.$inferSelect
export type NewFlashcardProgress = typeof flashcardProgress.$inferInsert







