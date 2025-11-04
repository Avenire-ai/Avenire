import { pgTable, text, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core"
import { user } from "./auth-schema"

export const studySessions = pgTable("study_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  
  // Session metadata
  sessionType: text("session_type").notNull(), // "flashcard" | "quiz" | "study-list"
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in seconds
  
  // Items studied
  itemsStudied: jsonb("items_studied").$type<{
    flashcards?: Array<{
      flashcardId: string;
      cardIndex: number;
      reviewed: boolean;
      correct: boolean;
      confidence: number;
    }>;
    quizQuestions?: Array<{
      quizId: string;
      questionIndex: number;
      answered: boolean;
      correct: boolean;
      confidence: number;
    }>;
  }>(),
  
  // Performance metrics
  totalItems: integer("total_items").notNull().default(0),
  correctItems: integer("correct_items").notNull().default(0),
  incorrectItems: integer("incorrect_items").notNull().default(0),
  skippedItems: integer("skipped_items").notNull().default(0),
  averageConfidence: real("average_confidence"),
  
  // Additional metadata
  metadata: jsonb("metadata").$type<{
    topic?: string;
    difficulty?: string;
    studyMode?: string; // "spaced-repetition" | "practice" | "review"
    notes?: string;
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type StudySession = typeof studySessions.$inferSelect
export type NewStudySession = typeof studySessions.$inferInsert







