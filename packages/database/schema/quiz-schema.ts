import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { user } from "./auth-schema"
import { chat } from "./chat-schema"

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  chatId: text("chat_id").references(() => chat.id),
  topic: text("topic").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type Quiz = typeof quizzes.$inferSelect
export type NewQuiz = typeof quizzes.$inferInsert 