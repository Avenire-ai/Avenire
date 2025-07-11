// import "server-only"

import { chat, flashcards, Message, message, NewFlashcard, NewQuiz, quizzes } from "@avenire/database/schema";
import { asc, desc, eq, and, gt, inArray } from "drizzle-orm";
import { database } from "..";


export async function saveFlashcard(flashcard: NewFlashcard) {
  try {
    return await database.insert(flashcards).values(flashcard)
  } catch (error) {
    console.error('Failed to save flashcard in database')
    throw error
  }
}

export async function getFlashcardById({ id }: { id: string }) {
  try {
    const [selectedFlashcard] = await database.select().from(flashcards).where(eq(flashcards.id, id))
    return selectedFlashcard
  } catch (error) {
    console.error('Failed to get flashcard by id from database')
    console.error(error)
  }
}

export async function getFlashcardsByUserId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, id))
      .orderBy(desc(flashcards.createdAt))
  } catch (error) {
    console.error('Failed to get flashcards by user from database')
    throw error
  }
}

export async function getFlashcardsByChatId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(flashcards)
      .where(eq(flashcards.chatId, id))
      .orderBy(desc(flashcards.createdAt))
  } catch (error) {
    console.error('Failed to get flashcards by chat from database')
    throw error
  }
}

export async function deleteFlashcardById({ id }: { id: string }) {
  try {
    return await database.delete(flashcards).where(eq(flashcards.id, id))
  } catch (error) {
    console.error('Failed to delete flashcard by id from database')
    throw error
  }
}

export async function saveQuiz(quiz: NewQuiz) {
  try {
    return await database.insert(quizzes).values(quiz)
  } catch (error) {
    console.error('Failed to save quiz in database')
    throw error
  }
}

export async function getQuizById({ id }: { id: string }) {
  try {
    const [selectedQuiz] = await database.select().from(quizzes).where(eq(quizzes.id, id))
    return selectedQuiz
  } catch (error) {
    console.error('Failed to get quiz by id from database')
    console.error(error)
  }
}

export async function getQuizzesByUserId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, id))
      .orderBy(desc(quizzes.createdAt))
  } catch (error) {
    console.error('Failed to get quizzes by user from database')
    throw error
  }
}

export async function getQuizzesByChatId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(quizzes)
      .where(eq(quizzes.chatId, id))
      .orderBy(desc(quizzes.createdAt))
  } catch (error) {
    console.error('Failed to get quizzes by chat from database')
    throw error
  }
}

export async function deleteQuizById({ id }: { id: string }) {
  try {
    return await database.delete(quizzes).where(eq(quizzes.id, id))
  } catch (error) {
    console.error('Failed to delete quiz by id from database')
    throw error
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await database.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await database.delete(message).where(eq(message.chatId, id));

    return await database.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    // throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await database.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    console.error(error)
  }
}

export async function saveMessages({ messages }: { messages: Message[] }) {
  try {
    return await database.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function getTopChatsByUserId({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt))
      .limit(5);
  } catch (error) {
    console.error('Failed to get top chats by user from database');
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await database
      .select()
      .from(message)
      .where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await database
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gt(message.createdAt, timestamp)), // Changed from gte to gt
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      return await database
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error('Failed to delete messages by chat id after timestamp');
    throw error;
  }
}
