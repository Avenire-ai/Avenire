import { log, captureException } from "@avenire/logger/server";
import {
  chat,
  flashcards,
  Message,
  message,
  NewFlashcard,
  NewQuiz,
  quizzes,
  user,
  verification
} from "@avenire/database/schema";
import { asc, desc, eq, and, gt, inArray, sql, count, lt, notInArray } from "drizzle-orm";
import { database } from "..";

// Optimized chat queries with pagination
export async function getChatsByUserIdPaginated({
  id,
  page = 1,
  pageSize = 20
}: {
  id: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const offsetValue = (page - 1) * pageSize;

    const [chatsResult, totalCountResult] = await Promise.all([
      database
        .select()
        .from(chat)
        .where(eq(chat.userId, id))
        .orderBy(desc(chat.createdAt))
        .limit(pageSize)
        .offset(offsetValue),
      database
        .select({ count: count() })
        .from(chat)
        .where(eq(chat.userId, id))
    ]);

    return {
      chats: chatsResult,
      totalCount: totalCountResult[0]?.count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / pageSize)
    };
  } catch (error) {
    log.error('Failed to get paginated chats by user from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Optimized message queries with pagination
export async function getMessagesByChatIdPaginated({
  id,
  page = 1,
  pageSize = 50
}: {
  id: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const offsetValue = (page - 1) * pageSize;

    const [messagesResult, totalCountResult] = await Promise.all([
      database
        .select()
        .from(message)
        .where(eq(message.chatId, id))
        .orderBy(asc(message.createdAt))
        .limit(pageSize)
        .offset(offsetValue),
      database
        .select({ count: count() })
        .from(message)
        .where(eq(message.chatId, id))
    ]);

    return {
      messages: messagesResult,
      totalCount: totalCountResult[0]?.count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / pageSize)
    };
  } catch (error) {
    log.error('Failed to get paginated messages by chat id from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Batch operations for better performance
export async function saveMessagesBatch({
  messages,
  batchSize = 100
}: {
  messages: Message[];
  batchSize?: number;
}) {
  try {
    if (messages.length === 0) {
      return;
    }

    // Process in batches to avoid memory issues
    const batches = [];
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await database
        .insert(message)
        .values(batch)
        .onConflictDoUpdate({
          target: message.id,
          set: {
            role: sql`excluded.role`,
            parts: sql`excluded.parts`,
            attachments: sql`excluded.attachments`,
            createdAt: sql`excluded."createdAt"`,
          },
        });
      results.push(result);
    }

    return results;
  } catch (error) {
    log.error('Failed to save messages batch in database', { error });
    captureException(error, log);
    throw error;
  }
}

// Optimized flashcard queries
export async function getFlashcardsByUserIdPaginated({
  id,
  page = 1,
  pageSize = 20
}: {
  id: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const offsetValue = (page - 1) * pageSize;

    const [flashcardsResult, totalCountResult] = await Promise.all([
      database
        .select()
        .from(flashcards)
        .where(eq(flashcards.userId, id))
        .orderBy(desc(flashcards.createdAt))
        .limit(pageSize)
        .offset(offsetValue),
      database
        .select({ count: count() })
        .from(flashcards)
        .where(eq(flashcards.userId, id))
    ]);

    return {
      flashcards: flashcardsResult,
      totalCount: totalCountResult[0]?.count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / pageSize)
    };
  } catch (error) {
    log.error('Failed to get paginated flashcards by user from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Optimized quiz queries
export async function getQuizzesByUserIdPaginated({
  id,
  page = 1,
  pageSize = 20
}: {
  id: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const offsetValue = (page - 1) * pageSize;

    const [quizzesResult, totalCountResult] = await Promise.all([
      database
        .select()
        .from(quizzes)
        .where(eq(quizzes.userId, id))
        .orderBy(desc(quizzes.createdAt))
        .limit(pageSize)
        .offset(offsetValue),
      database
        .select({ count: count() })
        .from(quizzes)
        .where(eq(quizzes.userId, id))
    ]);

    return {
      quizzes: quizzesResult,
      totalCount: totalCountResult[0]?.count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / pageSize)
    };
  } catch (error) {
    log.error('Failed to get paginated quizzes by user from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Search functionality with full-text search
export async function searchChatsByTitle({
  userId,
  searchTerm,
  limit: searchLimit = 10
}: {
  userId: string;
  searchTerm: string;
  limit?: number;
}) {
  try {
    return await database
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.userId, userId),
          sql`${chat.title} ILIKE ${`%${searchTerm}%`}`
        )
      )
      .orderBy(desc(chat.createdAt))
      .limit(searchLimit);
  } catch (error) {
    log.error('Failed to search chats by title from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Get user statistics
export async function getUserStats({ id }: { id: string }) {
  try {
    const [chatCount, messageCount, flashcardCount, quizCount] = await Promise.all([
      database.select({ count: count() }).from(chat).where(eq(chat.userId, id)),
      database
        .select({ count: count() })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(eq(chat.userId, id)),
      database.select({ count: count() }).from(flashcards).where(eq(flashcards.userId, id)),
      database.select({ count: count() }).from(quizzes).where(eq(quizzes.userId, id))
    ]);

    return {
      chatCount: chatCount[0]?.count || 0,
      messageCount: messageCount[0]?.count || 0,
      flashcardCount: flashcardCount[0]?.count || 0,
      quizCount: quizCount[0]?.count || 0
    };
  } catch (error) {
    log.error('Failed to get user stats from database', { error });
    captureException(error, log);
    throw error;
  }
}

// Cleanup old data
export async function cleanupOldData({
  olderThanDays = 90
}: {
  olderThanDays?: number;
}) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Delete old verification records
    const deletedVerifications = await database
      .delete(verification)
      .where(lt(verification.expiresAt, cutoffDate));

    // Delete old messages from deleted chats
    const deletedMessages = await database
      .delete(message)
      .where(
        and(
          lt(message.createdAt, cutoffDate),
          notInArray(
            message.chatId,
            database.select({ id: chat.id }).from(chat)
          )
        )
      );

    return {
      deletedVerifications: Array.isArray(deletedVerifications) ? deletedVerifications.length : 0,
      deletedMessages: Array.isArray(deletedMessages) ? deletedMessages.length : 0
    };
  } catch (error) {
    log.error('Failed to cleanup old data from database', { error });
    captureException(error, log);
    throw error;
  }
}
