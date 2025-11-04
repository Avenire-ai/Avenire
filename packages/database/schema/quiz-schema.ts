import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { user } from "./auth-schema"
import { chat } from "./chat-schema"

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  chatId: text("chat_id").references(() => chat.id),
  topic: text("topic").notNull(),
  title: text("title"), // AI-generated or user-provided title
  tags: jsonb("tags").$type<string[]>(), // AI-generated or user-provided tags
  content: jsonb("content").notNull().$type<{
    questions: Array<{
      id: number;
      type: "MCQ" | "True/False" | "Image-based" | "Interactive" | "Problem-solving";
      question: string;
      options: string[];
      correct: number;
      explanation: string;
      hint: string;
      difficulty: "beginner" | "intermediate" | "advanced";
      stepByStepSolution: string;
      commonMistakes: string[];
      learningObjectives: string[];
      followUpQuestions?: string[];
    }>;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type Quiz = typeof quizzes.$inferSelect
export type NewQuiz = typeof quizzes.$inferInsert 