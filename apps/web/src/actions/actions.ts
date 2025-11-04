"use server";

import { fermion, generateText, UIMessage, generateObject } from "@avenire/ai";
import { z } from "zod";
import { getTopChatsByUserId, getMessageById, deleteMessagesByChatIdAfterTimestamp, getFlashcardsByChatId, getQuizzesByChatId, getChatById, deleteChatById, saveFlashcard, getQuizById, getFlashcardById } from "@avenire/database/queries";
import { saveFlashcardProgress, getFlashcardProgressByFlashcardId, updateFlashcardProgress, getDueFlashcards, saveQuizProgress, getQuizProgressByQuizId, updateQuizProgress, getDueQuizQuestions, saveStudySession, updateStudySession, getLibraryItems } from "@avenire/database/queries";
import { updateSpacedRepetition, initializeState, calculateMastery, calculateEloRating as updateElo, calculateDynamicKFactor, getInitialEloRating } from "@avenire/models";
import { v4 as uuid } from "uuid";
import { auth } from "@avenire/auth/server";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";
import { createClient } from "redis";
import { log } from "@avenire/logger/server";

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on('error', (err) => {
  log.error('Redis Client Error', err);
});

async function getRedisClient() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

export async function getMatplotlibCache(hash: string): Promise<string | null> {
  if (!hash) return null;
  try {
    const client = await getRedisClient();
    const url = await client.get(`matplotlib-cache:${hash}`);
    return url || null;
  } catch (error) {
    log.error('Redis GET error:', { error, hash });
    return null;
  }
}

export async function setMatplotlibCache(hash: string, url: string): Promise<boolean> {
  if (!hash || !url) return false;
  try {
    const client = await getRedisClient();
    await client.set(`matplotlib-cache:${hash}`, url);
    return true;
  } catch (error) {
    log.error('Redis SET error:', { error, hash });
    return false;
  }
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: fermion.languageModel('fermion-sprint'),
    prompt: `
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
    ${JSON.stringify(message)}`,
  });

  return title;
}

const utapi = new UTApi();

export async function deleteFile(url: string) {
  try {
    const newUrl = url.substring(url.lastIndexOf("/") + 1);
    await utapi.deleteFiles(newUrl);
    return { success: true, error: null }
  } catch (error) {
    log.error('Failed to delete file from UploadThing', { error, url });
    return { success: false, error }
  }

}

export async function getRecentChats(userId: string) {
  try {
    const chats = await getTopChatsByUserId({ id: userId });
    return { chats, error: null };
  } catch (error) {
    log.error('Failed to get recent chats', { error, userId });
    return { chats: [], error };
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const [message] = await getMessageById({ id });
    if (!message) {
      throw new Error('Message not found');
    }

    await deleteMessagesByChatIdAfterTimestamp({
      chatId: message.chatId,
      timestamp: message.createdAt,
    });

    return { success: true, error: null };
  } catch (error) {
    log.error('Failed to delete trailing messages', { error, messageId: id });
    return { success: false, error };
  }
}

export async function getFlashcardsForChat({ chatId }: { chatId: string }) {
  try {
    const flashcards = await getFlashcardsByChatId({ id: chatId });
    return { flashcards, error: null };
  } catch (error) {
    log.error('Failed to get flashcards for chat', { error, chatId });
    return { flashcards: [], error };
  }
}

export async function getQuizzesForChat({ chatId }: { chatId: string }) {
  try {
    const quizzes = await getQuizzesByChatId({ id: chatId });
    return { quizzes, error: null };
  } catch (error) {
    log.error('Failed to get quizzes for chat', { error, chatId });
    return { quizzes: [], error };
  }
}

export async function getChatTitle({ chatId }: { chatId: string }) {
  try {
    const chat = await getChatById({ id: chatId });
    return { title: chat?.title || 'Untitled Chat', error: null };
  } catch (error) {
    log.error('Failed to get chat title', { error, chatId });
    return { title: 'Untitled Chat', error };
  }
}

export async function deleteChat({ chatId }: { chatId: string }) {
  try {
    await deleteChatById({ id: chatId });
    return { success: true, error: null };
  } catch (error) {
    log.error('Failed to delete chat', { error, chatId });
    return { success: false, error };
  }
}

export async function convertQuizToFlashcard({
  quizId,
  questionIndex
}: {
  quizId: string;
  questionIndex: number
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const quiz = await getQuizById({ id: quizId });
    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    const content = quiz.content as {
      questions: Array<{
        id: number;
        type?: string;
        question: string;
        options: string[];
        correct: number;
        explanation: string;
        difficulty: string;
      }>;
    };

    const question = content.questions[questionIndex];
    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Extract the quiz ID and question ID from the combined ID
    const [parentQuizId] = quizId.split('-');

    // Convert quiz question to flashcard format
    const flashcardContent = {
      cards: [{
        id: question.id,
        topic: quiz.topic,
        question: question.question,
        answer: `${question.options[question.correct]} - ${question.explanation}`,
        tags: [(question.type as string) || "MCQ", question.difficulty],
        difficulty: question.difficulty,
      }]
    };

    const flashcardId = `${parentQuizId}-flashcard-${question.id}`;

    // Generate title and tags using AI
    const metadataSchema = z.object({
      title: z.string().describe("A concise, descriptive title for this flashcard (max 60 chars)"),
      tags: z.array(z.string()).describe("3-5 relevant tags for categorization")
    });

    let title = `${quiz.topic} - Question ${question.id}`;
    let tags: string[] = [(question.type as string) || "MCQ", question.difficulty];

    try {
      const { object: metadata } = await generateObject({
        model: fermion.languageModel("fermion-sprint"),
        schema: metadataSchema,
        prompt: `Generate a concise title and relevant tags for a flashcard with the following content:
        
Question: ${question.question}
Answer: ${question.explanation}
Topic: ${quiz.topic}
Difficulty: ${question.difficulty}

Create a short, descriptive title (max 60 characters) and 3-5 relevant tags.`
      });
      title = metadata.title;
      tags = metadata.tags;
    } catch (err) {
      log.error('Failed to generate flashcard metadata', { error: err });
    }

    await saveFlashcard({
      id: flashcardId,
      content: flashcardContent,
      topic: quiz.topic,
      title,
      tags,
      userId: session.user.id,
      chatId: quiz.chatId || undefined
    });

    return { success: true, error: null, flashcardId };
  } catch (error) {
    log.error('Failed to convert quiz to flashcard', { error, quizId, questionIndex });
    return { success: false, error };
  }
}

// ========== Study Session Actions ==========

export async function startStudySession({
  sessionType,
  metadata,
}: {
  sessionType: "flashcard" | "quiz" | "study-list";
  metadata?: {
    topic?: string;
    difficulty?: string;
    studyMode?: string;
  };
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", sessionId: null };
    }

    const sessionId = uuid();
    await saveStudySession({
      id: sessionId,
      userId: session.user.id,
      sessionType,
      startTime: new Date(),
      totalItems: 0,
      correctItems: 0,
      incorrectItems: 0,
      skippedItems: 0,
      itemsStudied: {
        flashcards: [],
        quizQuestions: [],
      },
      metadata,
    });

    return { success: true, error: null, sessionId };
  } catch (error) {
    log.error('Failed to start study session', { error });
    return { success: false, error, sessionId: null };
  }
}

export async function endStudySession({
  sessionId,
  duration,
  itemsStudied,
  performance,
}: {
  sessionId: string;
  duration: number;
  itemsStudied: {
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
  };
  performance: {
    totalItems: number;
    correctItems: number;
    incorrectItems: number;
    skippedItems: number;
    averageConfidence?: number;
  };
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await updateStudySession(sessionId, {
      endTime: new Date(),
      duration,
      itemsStudied,
      totalItems: performance.totalItems,
      correctItems: performance.correctItems,
      incorrectItems: performance.incorrectItems,
      skippedItems: performance.skippedItems,
      averageConfidence: performance.averageConfidence,
    });

    return { success: true, error: null };
  } catch (error) {
    log.error('Failed to end study session', { error, sessionId });
    return { success: false, error };
  }
}

// ========== Flashcard Progress Actions ==========

export async function updateFlashcardProgressAction({
  flashcardId,
  cardIndex,
  confidence,
  correct,
  timeSpent,
  algorithm = "FSRS",
}: {
  flashcardId: string;
  cardIndex: number;
  confidence: number;
  correct: boolean;
  timeSpent: number;
  algorithm?: "FSRS" | "SM-2" | "Leitner";
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    let progress = await getFlashcardProgressByFlashcardId({
      flashcardId,
      cardIndex,
      userId: session.user.id,
    });

    const reviewResult = { confidence, correct, timeSpent };
    const now = new Date();

    if (!progress) {
      const initialState = initializeState(algorithm);
      const updatedState = updateSpacedRepetition(initialState, reviewResult, algorithm);
      const newElo = updateElo(1500, confidence, correct);
      const mastery = calculateMastery(updatedState);

      const progressId = uuid();
      await saveFlashcardProgress({
        id: progressId,
        userId: session.user.id,
        flashcardId,
        cardIndex,
        interval: updatedState.interval,
        easeFactor: updatedState.easeFactor,
        repetitionCount: updatedState.repetitionCount,
        algorithm,
        dueDate: updatedState.dueDate,
        lastStudied: now,
        studySessions: 1,
        masteryLevel: mastery,
        eloRating: newElo,
        confidence,
        performanceTrends: {
          history: [{
            timestamp: now.toISOString(),
            confidence,
            correct,
            timeSpent,
            easeFactor: updatedState.easeFactor,
            interval: updatedState.interval,
          }],
        },
        leitnerBox: updatedState.leitnerBox,
        fsrsState: updatedState.fsrsState ? {
          stability: updatedState.fsrsState.stability,
          difficulty: updatedState.fsrsState.difficulty,
          lastReview: updatedState.fsrsState.lastReview.toISOString(),
          reps: updatedState.fsrsState.reps,
          lapses: updatedState.fsrsState.lapses,
          state: updatedState.fsrsState.state,
        } : undefined,
      });

      return { success: true, error: null };
    }

    const currentState = {
      interval: progress.interval,
      easeFactor: progress.easeFactor,
      repetitionCount: progress.repetitionCount,
      dueDate: progress.dueDate,
      lastStudied: progress.lastStudied || undefined,
      leitnerBox: progress.leitnerBox || undefined,
      fsrsState: progress.fsrsState ? {
        stability: progress.fsrsState.stability,
        difficulty: progress.fsrsState.difficulty,
        lastReview: new Date(progress.fsrsState.lastReview),
        reps: progress.fsrsState.reps,
        lapses: progress.fsrsState.lapses,
        state: progress.fsrsState.state,
      } : undefined,
    };

    const updatedState = updateSpacedRepetition(currentState, reviewResult, algorithm as any);
    const newElo = updateElo(progress.eloRating, confidence, correct);
    const mastery = calculateMastery(updatedState);

    const history = progress.performanceTrends?.history || [];
    history.push({
      timestamp: now.toISOString(),
      confidence,
      correct,
      timeSpent,
      easeFactor: updatedState.easeFactor,
      interval: updatedState.interval,
    });

    await updateFlashcardProgress(progress.id, {
      interval: updatedState.interval,
      easeFactor: updatedState.easeFactor,
      repetitionCount: updatedState.repetitionCount,
      dueDate: updatedState.dueDate,
      lastStudied: now,
      studySessions: progress.studySessions + 1,
      masteryLevel: mastery,
      eloRating: newElo,
      confidence,
      performanceTrends: { history },
      leitnerBox: updatedState.leitnerBox,
      fsrsState: updatedState.fsrsState ? {
        stability: updatedState.fsrsState.stability,
        difficulty: updatedState.fsrsState.difficulty,
        lastReview: updatedState.fsrsState.lastReview.toISOString(),
        reps: updatedState.fsrsState.reps,
        lapses: updatedState.fsrsState.lapses,
        state: updatedState.fsrsState.state,
      } : undefined,
    });

    return { success: true, error: null };
  } catch (error) {
    log.error('Failed to update flashcard progress', { error, flashcardId, cardIndex });
    return { success: false, error };
  }
}

export async function getDueFlashcardsAction({ limit }: { limit?: number } = {}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { flashcards: [], error: "Unauthorized" };
    }

    const dueFlashcards = await getDueFlashcards({
      userId: session.user.id,
      limit,
    });

    // Fetch actual flashcard content for each progress item
    const flashcardsWithContent = await Promise.all(
      dueFlashcards.map(async (fp: any) => {
        try {
          const flashcard = await getFlashcardById({ id: fp.flashcardId });
          if (flashcard?.content) {
            const content = flashcard.content as { cards: Array<any> };
            const card = content.cards[fp.cardIndex];
            return {
              ...fp,
              question: card?.question || "",
              answer: card?.answer || "",
              topic: flashcard.topic || card?.topic || "",
              difficulty: card?.difficulty || "intermediate",
              // Initialize default progress if new
              dueDate: fp.isNew ? new Date() : fp.dueDate,
              interval: fp.isNew ? 1 : fp.interval,
              easeFactor: fp.isNew ? 2.5 : fp.easeFactor,
              repetitionCount: fp.isNew ? 0 : fp.repetitionCount,
              studySessions: fp.isNew ? 0 : fp.studySessions,
              masteryLevel: fp.isNew ? 0 : fp.masteryLevel,
              eloRating: fp.isNew ? 1500 : fp.eloRating,
            };
          }
        } catch (err) {
          log.error('Failed to fetch flashcard content', { error: err, flashcardId: fp.flashcardId });
        }
        return {
          ...fp,
          question: "",
          answer: "",
          topic: "",
          difficulty: "intermediate",
          dueDate: fp.isNew ? new Date() : fp.dueDate,
        };
      })
    );

    return { flashcards: flashcardsWithContent, error: null };
  } catch (error) {
    log.error('Failed to get due flashcards', { error });
    return { flashcards: [], error };
  }
}

// ========== Quiz Progress Actions ==========

export async function updateQuizProgressAction({
  quizId,
  questionIndex,
  confidence,
  correct,
  timeSpent,
  selectedAnswer,
  algorithm = "FSRS",
}: {
  quizId: string;
  questionIndex: number;
  confidence: number;
  correct: boolean;
  timeSpent: number;
  selectedAnswer?: number;
  algorithm?: "FSRS" | "SM-2" | "Leitner";
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    let progress = await getQuizProgressByQuizId({
      quizId,
      questionIndex,
      userId: session.user.id,
    });

    const reviewResult = { confidence, correct, timeSpent };
    const now = new Date();

    if (!progress) {
      const initialState = initializeState(algorithm);
      const updatedState = updateSpacedRepetition(initialState, reviewResult, algorithm);
      const newElo = updateElo(1500, confidence, correct);
      const mastery = calculateMastery(updatedState);

      const progressId = uuid();
      await saveQuizProgress({
        id: progressId,
        userId: session.user.id,
        quizId,
        questionIndex,
        interval: updatedState.interval,
        easeFactor: updatedState.easeFactor,
        repetitionCount: updatedState.repetitionCount,
        algorithm,
        dueDate: updatedState.dueDate,
        lastStudied: now,
        studySessions: 1,
        masteryLevel: mastery,
        eloRating: newElo,
        confidence,
        lastCorrect: correct,
        totalAttempts: 1,
        correctAttempts: correct ? 1 : 0,
        performanceTrends: {
          history: [{
            timestamp: now.toISOString(),
            confidence,
            correct,
            timeSpent,
            selectedAnswer,
            correctAnswer: 0,
            easeFactor: updatedState.easeFactor,
            interval: updatedState.interval,
          }],
        },
        leitnerBox: updatedState.leitnerBox,
        fsrsState: updatedState.fsrsState ? {
          stability: updatedState.fsrsState.stability,
          difficulty: updatedState.fsrsState.difficulty,
          lastReview: updatedState.fsrsState.lastReview.toISOString(),
          reps: updatedState.fsrsState.reps,
          lapses: updatedState.fsrsState.lapses,
          state: updatedState.fsrsState.state,
        } : undefined,
      });

      return { success: true, error: null };
    }

    const currentState = {
      interval: progress.interval,
      easeFactor: progress.easeFactor,
      repetitionCount: progress.repetitionCount,
      dueDate: progress.dueDate,
      lastStudied: progress.lastStudied || undefined,
      leitnerBox: progress.leitnerBox || undefined,
      fsrsState: progress.fsrsState ? {
        stability: progress.fsrsState.stability,
        difficulty: progress.fsrsState.difficulty,
        lastReview: new Date(progress.fsrsState.lastReview),
        reps: progress.fsrsState.reps,
        lapses: progress.fsrsState.lapses,
        state: progress.fsrsState.state,
      } : undefined,
    };

    const updatedState = updateSpacedRepetition(currentState, reviewResult, algorithm as any);
    const newElo = updateElo(progress.eloRating, confidence, correct);
    const mastery = calculateMastery(updatedState);

    const history = progress.performanceTrends?.history || [];
    history.push({
      timestamp: now.toISOString(),
      confidence,
      correct,
      timeSpent,
      selectedAnswer,
      correctAnswer: 0,
      easeFactor: updatedState.easeFactor,
      interval: updatedState.interval,
    });

    await updateQuizProgress(progress.id, {
      interval: updatedState.interval,
      easeFactor: updatedState.easeFactor,
      repetitionCount: updatedState.repetitionCount,
      dueDate: updatedState.dueDate,
      lastStudied: now,
      studySessions: progress.studySessions + 1,
      masteryLevel: mastery,
      eloRating: newElo,
      confidence,
      lastCorrect: correct,
      totalAttempts: progress.totalAttempts + 1,
      correctAttempts: progress.correctAttempts + (correct ? 1 : 0),
      performanceTrends: { history },
      leitnerBox: updatedState.leitnerBox,
      fsrsState: updatedState.fsrsState ? {
        stability: updatedState.fsrsState.stability,
        difficulty: updatedState.fsrsState.difficulty,
        lastReview: updatedState.fsrsState.lastReview.toISOString(),
        reps: updatedState.fsrsState.reps,
        lapses: updatedState.fsrsState.lapses,
        state: updatedState.fsrsState.state,
      } : undefined,
    });

    return { success: true, error: null };
  } catch (error) {
    log.error('Failed to update quiz progress', { error, quizId, questionIndex });
    return { success: false, error };
  }
}

export async function getFlashcardContentAction({ flashcardId }: { flashcardId: string }) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { content: null, error: "Unauthorized" };
    }

    const flashcard = await getFlashcardById({ id: flashcardId });
    if (!flashcard) {
      return { content: null, error: "Flashcard not found" };
    }

    return { content: flashcard.content, topic: flashcard.topic, title: flashcard.title, tags: flashcard.tags, error: null };
  } catch (error) {
    log.error('Failed to get flashcard content', { error });
    return { content: null, error };
  }
}

export async function getQuizContentAction({ quizId }: { quizId: string }) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { content: null, error: "Unauthorized" };
    }

    const quiz = await getQuizById({ id: quizId });
    if (!quiz) {
      return { content: null, error: "Quiz not found" };
    }

    return { content: quiz.content, topic: quiz.topic, title: quiz.title, tags: quiz.tags, error: null };
  } catch (error) {
    log.error('Failed to get quiz content', { error });
    return { content: null, error };
  }
}

export async function getDueQuizQuestionsAction({ limit }: { limit?: number } = {}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { questions: [], error: "Unauthorized" };
    }

    const dueQuestions = await getDueQuizQuestions({
      userId: session.user.id,
      limit,
    });

    // Fetch actual quiz content for each progress item
    const questionsWithContent = await Promise.all(
      dueQuestions.map(async (qp: any) => {
        try {
          const quiz = await getQuizById({ id: qp.quizId });
          if (quiz?.content) {
            const content = quiz.content as { questions: Array<any> };
            const question = content.questions[qp.questionIndex];
            return {
              ...qp,
              question: question?.question || "",
              options: question?.options || [],
              correct: question?.correct ?? 0,
              explanation: question?.explanation || "",
              // Initialize default progress if new
              dueDate: qp.isNew ? new Date() : qp.dueDate,
              interval: qp.isNew ? 1 : qp.interval,
              easeFactor: qp.isNew ? 2.5 : qp.easeFactor,
              repetitionCount: qp.isNew ? 0 : qp.repetitionCount,
              studySessions: qp.isNew ? 0 : qp.studySessions,
              masteryLevel: qp.isNew ? 0 : qp.masteryLevel,
              eloRating: qp.isNew ? 1500 : qp.eloRating,
            };
          }
        } catch (err) {
          log.error('Failed to fetch quiz content', { error: err, quizId: qp.quizId });
        }
        return {
          ...qp,
          question: "",
          options: [],
          correct: 0,
          explanation: "",
          dueDate: qp.isNew ? new Date() : qp.dueDate,
        };
      })
    );

    return { questions: questionsWithContent, error: null };
  } catch (error) {
    log.error('Failed to get due quiz questions', { error });
    return { questions: [], error };
  }
}

// ========== Library Actions ==========

export async function getLibraryItemsAction({
  filters,
  sort,
  page = 1,
  pageSize = 20,
}: {
  filters: {
    type?: "flashcard" | "quiz" | "all";
    topic?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    masteryLevel?: { min: number; max: number };
    dueDate?: "due" | "not_due" | "all";
    searchQuery?: string;
  };
  sort?: {
    field: "createdAt" | "dueDate" | "eloRating" | "lastStudied" | "masteryLevel";
    order: "asc" | "desc";
  };
  page?: number;
  pageSize?: number;
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { flashcards: [], quizzes: [], total: 0, error: "Unauthorized" };
    }

    const result = await getLibraryItems({
      filters: {
        ...filters,
        userId: session.user.id,
      },
      sort,
      page,
      pageSize,
    });

    return { ...result, error: null };
  } catch (error) {
    log.error('Failed to get library items', { error });
    return { flashcards: [], quizzes: [], total: 0, error };
  }
}
