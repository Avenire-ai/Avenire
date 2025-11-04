import { pgTable, text, timestamp, jsonb, integer, real, doublePrecision, boolean } from "drizzle-orm/pg-core"
import { quizzes } from "./quiz-schema"
import { user } from "./auth-schema"

export const quizProgress = pgTable("quiz_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  quizId: text("quiz_id").notNull().references(() => quizzes.id),
  questionIndex: integer("question_index").notNull(), // Index within the quiz.content.questions array
  
  // Spaced repetition data
  interval: integer("interval").notNull().default(1),
  easeFactor: real("ease_factor").notNull().default(2.5),
  repetitionCount: integer("repetition_count").notNull().default(0),
  algorithm: text("algorithm").notNull().default("FSRS"),
  
  // Dates
  dueDate: timestamp("due_date").notNull().defaultNow(),
  lastStudied: timestamp("last_studied"),
  
  // Statistics
  studySessions: integer("study_sessions").notNull().default(0),
  masteryLevel: real("mastery_level").notNull().default(0),
  eloRating: doublePrecision("elo_rating").notNull().default(1500),
  
  // Performance tracking
  confidence: integer("confidence"), // Last confidence rating (1-5)
  lastCorrect: boolean("last_correct"), // Whether last attempt was correct
  totalAttempts: integer("total_attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  
  performanceTrends: jsonb("performance_trends").$type<{
    history: Array<{
      timestamp: string;
      confidence: number;
      correct: boolean;
      timeSpent: number; // seconds
      selectedAnswer?: number;
      correctAnswer: number;
      easeFactor?: number;
      interval?: number;
    }>;
  }>().default({ history: [] }),
  
  // Leitner system specific
  leitnerBox: integer("leitner_box").default(1),
  
  // FSRS specific parameters
  fsrsState: jsonb("fsrs_state").$type<{
    stability: number;
    difficulty: number;
    lastReview: string;
    reps: number;
    lapses: number;
    state: number;
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type QuizProgress = typeof quizProgress.$inferSelect
export type NewQuizProgress = typeof quizProgress.$inferInsert







