import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { chat } from "./chat-schema"
import { user } from "./auth-schema"

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  chatId: text("chat_id").references(() => chat.id),
  topic: text("topic").notNull(),
  title: text("title"), // AI-generated or user-provided title
  tags: jsonb("tags").$type<string[]>(), // AI-generated or user-provided tags
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

export type Flashcard = typeof flashcards.$inferSelect
export type NewFlashcard = typeof flashcards.$inferInsert 